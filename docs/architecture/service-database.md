# GapPatch 서비스 데이터베이스 설계

이 문서는 빈틈패치 모바일 웹 MVP가 파일 기반 상태에서 운영용 PostgreSQL 서비스 DB로 이동할 때의 기준 설계다. 목표는 문제 은행, 개인화된 일일 배정, AI 채점, 약점 개념 추적, 복습 큐를 한 흐름으로 연결하되, 현재 제품 원칙인 "하루 한 문제, 즉시 피드백, 약점 복습"을 단순하게 유지하는 것이다.

## 현재 상태

현재 웹 서버는 `.gappatch-data/state.json`을 읽고 쓰며, 런타임에서는 다음 Map 구조를 사용한다.

- `usersByEmail`: 베타 로그인 사용자와 학습 설정.
- `sessionsById`: 30일 세션.
- `assignmentsByKey`: `userId:localDate` 기준 일일 과제.
- `historyByUserId`: 제출 이후 피드백 히스토리.
- `masteryByUserConceptKey`: 사용자별 개념 안정도와 다음 복습일.
- `reviewByUserId`: 약점 복습 화면에 표시할 항목.

이 구조는 단일 서버 MVP에는 충분하지만, 운영 환경에서는 동시 요청, 배치 생성, AI 채점 재시도, 데이터 삭제 요청, 분석 쿼리를 안전하게 처리하기 어렵다. PostgreSQL 전환의 핵심은 "상태 스냅샷"을 "정규화된 이벤트와 파생 상태"로 바꾸는 것이다.

## 설계 원칙

- PostgreSQL을 서비스의 단일 원본으로 둔다.
- 하루 한 문제 보장은 `daily_assignments(user_id, local_date)` 유니크 제약으로 처리한다.
- 문제와 루브릭은 버전 불변으로 저장한다. 이미 배정된 과제는 이후 콘텐츠 수정의 영향을 받지 않는다.
- 제출, 채점, 개념 관찰은 append-only 이벤트로 남기고, 현재 히스토리/복습 화면은 최신 상태를 조회한다.
- AI 원문 응답은 최소 보관한다. 사용자 답변, 채점 요약, 개념 태그, 모델 메타데이터를 분리해 삭제와 감사가 가능해야 한다.
- 복습 큐는 `user_concept_mastery`에서 재계산 가능해야 하며, 알림/스케줄링이 필요할 때만 물리 테이블로 둔다.

## 핵심 엔티티

| 영역 | 테이블 | 역할 |
| --- | --- | --- |
| 계정 | `users`, `beta_invites`, `sessions` | 로그인, 세션, 타임존, 삭제 상태 |
| 학습 설정 | `user_learning_preferences`, `user_subjects` | 선택 과목과 목표 난이도 |
| 문제 은행 | `subjects`, `concepts`, `content_slots`, `problem_versions`, `rubric_versions`, `rubric_criteria` | 승인된 문제 풀과 커버리지 슬롯 |
| 배정 | `daily_assignments`, `assignment_selection_events` | 사용자별 일일 문제와 선택 근거 |
| 제출/채점 | `submissions`, `grading_runs`, `grading_feedback_items` | 답변, AI/규칙 채점 결과, 피드백 구성요소 |
| 개념 추적 | `concept_observations`, `user_concept_mastery` | 제출에서 관찰된 강점/누락/오개념과 현재 안정도 |
| 복습 | `review_queue_items` 또는 뷰 | 다음 복습일과 화면 표시용 이유 |
| 운영 | `ai_grading_jobs`, `audit_events`, `data_deletion_jobs` | 비동기 채점, 감사, 개인정보 삭제 |

## 주요 테이블 설계

### 계정과 학습 설정

`users`

- `id uuid primary key`
- `email citext unique not null`
- `timezone text not null`
- `status text not null check (status in ('active', 'deleted'))`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`
- `deleted_at timestamptz`

`user_learning_preferences`

- `user_id uuid primary key references users(id)`
- `difficulty text not null check (difficulty in ('foundation', 'working', 'deepening'))`
- `updated_at timestamptz not null`

`user_subjects`

- `user_id uuid references users(id)`
- `subject_id text references subjects(id)`
- `primary key (user_id, subject_id)`

현재 `selectedSubjects` 배열은 `user_subjects`로 분리한다. 사용자의 타임존은 일일 배정 날짜 계산에 직접 쓰이므로 `users.timezone`에 둔다.

### 문제 은행

`subjects`

- `id text primary key`
- `label text not null`
- `sort_order integer not null`
- `active boolean not null`

`concepts`

- `id text primary key`
- `subject_id text not null references subjects(id)`
- `label text not null`
- `active boolean not null`

`content_slots`

- `id uuid primary key`
- `subject_id text not null references subjects(id)`
- `concept_id text not null references concepts(id)`
- `scenario_frame text not null`
- `difficulty text not null`
- `target_problem_count integer not null`
- `unique (concept_id, scenario_frame, difficulty)`

`problem_versions`

- `id text primary key`
- `content_slot_id uuid not null references content_slots(id)`
- `rubric_version_id text not null`
- `status text not null check (status in ('draft', 'approved', 'retired'))`
- `generation_source text not null check (generation_source in ('approved_problem_pool'))`
- `title text not null`
- `prompt text not null`
- `answer_guidance text not null`
- `assignment_reason text not null`
- `created_at timestamptz not null`
- `approved_at timestamptz`

`rubric_versions`와 `rubric_criteria`는 문제와 독립적으로 버전 관리한다. `daily_assignments`는 배정 당시의 `problem_version_id`와 `rubric_version_id`를 모두 저장해 채점 재현성을 확보한다.

### 개인화 일일 배정

`daily_assignments`

- `id uuid primary key`
- `user_id uuid not null references users(id)`
- `local_date date not null`
- `subject_id text not null references subjects(id)`
- `concept_id text not null references concepts(id)`
- `problem_version_id text not null references problem_versions(id)`
- `rubric_version_id text not null references rubric_versions(id)`
- `scenario_frame text not null`
- `estimated_difficulty text not null`
- `assignment_reason text not null`
- `generation_source text not null`
- `realtime_generated boolean not null default false`
- `created_at timestamptz not null`
- `unique (user_id, local_date)`

선택 로직은 현재 코드와 같은 순서를 DB 쿼리로 옮긴다.

1. 사용자의 선택 과목과 목표 난이도에 맞는 승인 문제를 후보로 잡는다.
2. `user_concept_mastery.stability < 0.85` 중 가장 약한 개념을 우선한다.
3. 최근 5개 배정의 동일 문제와 인접 개념 반복을 피한다.
4. 후보가 부족하면 승인 풀 안에서 가장 안전한 대체 문제를 배정한다.

`assignment_selection_events`는 선택 당시 후보 수, 제외 사유, 약점 개념 선택 여부를 저장한다. 제품 동작에는 필수가 아니지만, 추천 품질을 디버깅할 때 유용하다.

### 제출과 AI 채점

`submissions`

- `id uuid primary key`
- `assignment_id uuid not null references daily_assignments(id)`
- `user_id uuid not null references users(id)`
- `answer_text text not null`
- `perceived_difficulty text check (perceived_difficulty in ('easy', 'right', 'hard'))`
- `attempt_no integer not null`
- `submitted_at timestamptz not null`
- `unique (assignment_id, attempt_no)`

현재 MVP는 같은 과제의 히스토리를 최신 제출로 대체한다. 운영 DB는 제출을 누적 저장하고, 화면에서는 과제별 최신 제출을 조회한다.

`grading_runs`

- `id uuid primary key`
- `submission_id uuid not null references submissions(id)`
- `rubric_version_id text not null references rubric_versions(id)`
- `provider text not null`
- `model text`
- `status text not null check (status in ('queued', 'succeeded', 'failed'))`
- `score numeric(4,3)`
- `label text check (label in ('Stable', 'Partial', 'Needs review'))`
- `summary text`
- `confidence numeric(4,3)`
- `error_code text`
- `created_at timestamptz not null`
- `completed_at timestamptz`

`grading_feedback_items`

- `id uuid primary key`
- `grading_run_id uuid not null references grading_runs(id)`
- `kind text not null check (kind in ('strength', 'missing_concept', 'misconception', 'review_concept'))`
- `concept_id text references concepts(id)`
- `body text not null`
- `sort_order integer not null`

초기에는 `provider='deterministic'`로 현재 규칙 채점을 저장하고, 외부 AI 도입 시 `provider`, `model`, `status`, `error_code`만 확장한다. 사용자에게 보여줄 피드백은 구조화된 필드에서 만들고, 모델 원문 로그는 기본 보관 대상에서 제외한다.

### 약점 개념 추적

`concept_observations`

- `id uuid primary key`
- `user_id uuid not null references users(id)`
- `assignment_id uuid not null references daily_assignments(id)`
- `submission_id uuid not null references submissions(id)`
- `grading_run_id uuid not null references grading_runs(id)`
- `concept_id text not null references concepts(id)`
- `observation_kind text not null check (observation_kind in ('stable', 'partial', 'misconception', 'missing'))`
- `score numeric(4,3) not null`
- `perceived_difficulty text`
- `created_at timestamptz not null`

`user_concept_mastery`

- `user_id uuid not null references users(id)`
- `concept_id text not null references concepts(id)`
- `stability numeric(4,3) not null`
- `last_score numeric(4,3) not null`
- `last_grading_run_id uuid references grading_runs(id)`
- `last_misconception text`
- `perceived_difficulty text`
- `next_review_at date not null`
- `updated_at timestamptz not null`
- `primary key (user_id, concept_id)`

`concept_observations`는 학습 기록이고, `user_concept_mastery`는 현재 상태 캐시다. 채점 성공 트랜잭션 안에서 두 테이블을 함께 갱신한다. 안정도 계산은 서비스 코드에 두되, 입력과 결과를 모두 저장해 이후 알고리즘을 바꿔도 검증할 수 있게 한다.

### 복습 큐

초기 운영에서는 별도 테이블 없이 뷰로 충분하다.

```sql
create view due_review_items as
select
  m.user_id,
  c.subject_id,
  m.concept_id,
  c.label as concept_label,
  m.next_review_at,
  m.stability,
  m.last_misconception
from user_concept_mastery m
join concepts c on c.id = m.concept_id
where m.stability < 0.85;
```

푸시 알림, 이메일, 복습 스누즈가 들어오면 `review_queue_items`를 추가한다.

- `id uuid primary key`
- `user_id uuid not null`
- `concept_id text not null`
- `source_mastery_updated_at timestamptz not null`
- `due_at timestamptz not null`
- `status text not null check (status in ('open', 'snoozed', 'completed'))`
- `created_at timestamptz not null`
- `completed_at timestamptz`

## 트랜잭션 경계

- 로그인: 사용자 upsert, 세션 생성.
- 과목 설정: 학습 설정과 선택 과목을 한 트랜잭션으로 교체.
- 일일 배정: 후보 조회와 `daily_assignments` insert를 한 트랜잭션으로 실행하고, 유니크 충돌 시 기존 배정을 반환한다.
- 제출: `submissions` insert 후 동기 채점이면 `grading_runs`, `grading_feedback_items`, `concept_observations`, `user_concept_mastery`까지 한 트랜잭션으로 갱신한다.
- 비동기 AI 채점: `submissions`와 `ai_grading_jobs`를 먼저 커밋하고, 워커가 채점 결과 트랜잭션을 완료한다.
- 계정 삭제: 사용자 상태를 `deleted`로 바꾸고, 답변 원문과 세션을 삭제하거나 익명화하는 작업을 `data_deletion_jobs`로 추적한다.

## 인덱스와 제약

- `users(email)` unique.
- `sessions(id)` primary key, `sessions(user_id, expires_at)`.
- `daily_assignments(user_id, local_date)` unique.
- `daily_assignments(user_id, created_at desc)` for history.
- `submissions(assignment_id, attempt_no)` unique.
- `submissions(user_id, submitted_at desc)` for history.
- `grading_runs(submission_id, created_at desc)`.
- `concept_observations(user_id, concept_id, created_at desc)`.
- `user_concept_mastery(user_id, next_review_at)` for review.
- `problem_versions(status, content_slot_id)` for approved-pool selection.

## 파일 상태에서 PostgreSQL로 이전

1. 스키마를 먼저 배포하고, 서비스 코드에는 저장소 인터페이스를 둔다. 파일 저장소와 Postgres 저장소가 같은 서비스 테스트를 통과해야 한다.
2. 기존 `.gappatch-data/state.json`을 백업한다. 원본 파일은 마이그레이션 입력으로만 사용하고 직접 수정하지 않는다.
3. import 스크립트로 매핑한다.
   - `invites` -> `beta_invites`
   - `users` -> `users`, `user_learning_preferences`, `user_subjects`
   - `sessions` -> `sessions`
   - `assignments` -> `daily_assignments`
   - `history` -> `submissions`, `grading_runs`, `grading_feedback_items`
   - `mastery` -> `user_concept_mastery`
   - `review` -> 뷰에서 재계산하고, 필요하면 `review_queue_items`
4. import 후 사용자 수, 세션 수, 과제 수, 히스토리 수, mastery 수를 파일 상태와 비교한다.
5. shadow read 단계에서 같은 요청을 파일 저장소와 Postgres 저장소에 대해 실행해 응답 shape와 핵심 id가 같은지 확인한다.
6. 쓰기 경로를 Postgres로 전환한다. 최소 한 릴리스 동안 파일 백업을 보관하되, 새 쓰기는 되돌려 쓰지 않는다.
7. 운영 안정화 후 파일 저장소 코드를 테스트 전용 fixture 또는 삭제 대상으로 분리한다.

## 첫 구현 범위

첫 번째 DB 전환은 다음 범위만 포함한다.

- 계정, 세션, 학습 설정.
- 승인 문제 풀과 루브릭 버전.
- 일일 배정 유니크 보장.
- 제출, 결정론적 채점 결과, 히스토리 조회.
- `user_concept_mastery` 기반 복습 조회.

다음은 후속 범위로 둔다.

- 외부 AI 채점 워커와 비용/속도 제어.
- 콘텐츠 생성 파이프라인과 승인 워크플로.
- 복습 알림과 스누즈.
- 관리자 분석 대시보드.
- 네이티브 앱 동기화 최적화.

이 순서가 현재 제품의 가장 중요한 약속인 "오늘의 문제를 안정적으로 배정하고, 제출 후 약점을 다시 보여준다"를 먼저 보호한다.
