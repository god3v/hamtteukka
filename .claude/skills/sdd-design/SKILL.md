---
name: sdd-design
description: 요구사항이 승인된 기능에서 Mermaid 다이어그램 중심의 설계 문서 docs/specs/NNN-이름/design/*.md를 만들고, RLS 정책 표와 아키텍처 문서를 갱신한 뒤 헌법 점검과 사용자 승인을 받을 때 사용한다.
---

# 설계 작성 (/sdd-design)

이 스킬은 승인된 요구사항을 도메인, 데이터, 흐름, 상태, 화면 다이어그램으로 옮기고 사용자 승인을 받는 실행 절차를 정한다. 절차를 마치면 `docs/specs/NNN-<kebab>/design/`에 승인된 설계 문서가 남고, 전체 ERD와 도메인 지도가 함께 갱신되며, Feature 이슈의 `SDD 단계`가 `작업 분해`로 바뀐다.

설계를 다이어그램 중심으로 쓰는 이유와 각 다이어그램의 역할은 [SDD 진행 가이드](../../../docs/sdd-guide.md)와 [ADR-0010](../../../docs/decisions/0010-sdd-diagram-first.md)이 설명한다. 이 스킬에는 실행할 순서와 점검 항목만 적는다.

## 입력

| 입력 | 위치 | 확인할 내용 |
|---|---|---|
| 요구사항 | `docs/specs/NNN-<kebab>/requirements.md` | `status: approved`, US·FR·NFR·AC 목록 |
| 헌법 | [constitution.md](../../../docs/constitution.md) | 설계가 지켜야 할 원칙 |
| ADR | [decisions/](../../../docs/decisions/README.md) | 0003 데이터 접근 경계, 0004 RLS, 0005 인증, 0006 마이그레이션 소유권, 0007 판매 대비 데이터 |
| 전체 ERD | [erd-overview.md](../../../docs/architecture/erd-overview.md) | 기존 테이블과 관계, 재사용할 테이블 |
| 도메인 지도 | [domain-map.md](../../../docs/architecture/domain-map.md) | 기존 도메인과 기능의 대응 |
| 설계 템플릿 | `docs/specs/_template/design/` | domain, erd, sequence, state, screens 문서 구조 |
| 다른 기능의 설계 | `docs/specs/*/design/` | 같은 테이블이나 화면을 이미 정의했는지 |

### 명령 실행 환경

- 이 스킬의 명령은 Bash 문법으로 적었다. Windows PowerShell 5.1은 네이티브 프로그램에 넘기는 인수 안의 큰따옴표를 지워 `--jq` 식이 깨지므로, Bash 도구에서 실행한다.
- `gh`가 PATH에 없으면 Windows에서는 `"/c/Program Files/GitHub CLI/gh.exe"`(Bash)나 `& "C:\Program Files\GitHub CLI\gh.exe"`(PowerShell)로 실행한다.
- Project 필드를 바꾸려면 토큰에 `project` 권한(scope)이 있어야 한다. 없으면 사용자에게 `gh auth refresh -s project` 실행을 요청한다.

## 절차

1. **요구사항 승인을 확인한다.** `requirements.md` frontmatter의 `status`가 `approved`가 아니면 멈추고, `/sdd-spec`으로 승인부터 받으라고 사용자에게 알린다.
2. **기준 문서를 읽는다.** 헌법, 입력 표의 ADR, 전체 ERD, 도메인 지도를 읽는다. 이번 기능이 재사용할 기존 테이블, 도메인, 화면을 목록으로 정리한다.
3. **설계 파일을 준비한다.**
   - `docs/specs/_template/design/`의 `domain.md`, `erd.md`, `sequence.md`, `screens.md`를 `docs/specs/NNN-<kebab>/design/`로 복사한다.
   - `state.md`는 상태에 따라 허용되는 동작이 달라지는 엔터티가 있을 때만 복사한다. 요구사항에 '진행 중'에서 '완성'으로 바뀌는 흐름처럼 상태 전이가 있으면 만든다.
   - 각 파일의 frontmatter에서 `status`를 `review`로, `updated`를 오늘 날짜로 바꾼다. 나머지 키는 템플릿을 따른다.
4. **`domain.md`를 쓴다.** `classDiagram`으로 도메인 개념과 `packages/shared`가 제공할 함수를 그린다.
   - 클래스는 요구사항에 나오는 엔터티와 값 객체를 나타낸다.
   - 메서드는 shared 함수의 시그니처로 쓰고, 반환 타입은 자체 DTO로 쓴다. 예: `+createProject(input) ProjectDto`.
   - Supabase 타입이나 `PostgrestError`를 클래스, 인수, 반환 타입에 쓰지 않는다. 실패는 자체 오류 타입으로 표현한다.
   - 다이어그램 아래 클래스 표에 클래스 이름, 뜻, 저장하는 테이블, 관련 `FR-xx`를 적는다. shared 함수 표에는 함수, 입력, 출력 DTO, 오류, 관련 `FR-xx`를 적는다.
5. **`erd.md`를 쓴다.** `erDiagram`과 RLS 정책 표를 함께 쓴다.
   - 이번 기능의 테이블은 `public` 스키마에 두고 `supabase/migrations`가 관리한다. 주문, 결제, 원장, 정산 같은 `commerce` 스키마 테이블은 Spring Flyway가 관리하므로 이 스킬에서 설계하지 않는다.
   - 다른 기능의 승인된 `design/erd.md`에 이미 있는 테이블은 다시 정의하지 않고 그 문서를 참조한다. `erd-overview.md`는 개념 모델이므로 설계의 기준으로 삼지 않으며, 이번 설계가 개념 모델과 다르면 설계를 마친 뒤 개념 모델을 고친다.
   - 회원을 식별하는 열에 이메일을 쓰지 않는다. 회원은 로그인 제공자와 제공자 사용자 ID의 조합으로 식별한다.
   - 회원이 소유하는 데이터는 `members` 테이블을 `member_id` 열로 참조한다. 현재 회원 ID를 `auth.uid()`로 구하는 방법은 001 계정 설계를 따른다.
   - 도안, 내 도안함, 가격, 동의 기록, 요율처럼 판매와 관련된 데이터는 [ADR-0007](../../../docs/decisions/0007-sales-ready-data-model.md)의 원칙을 따른다.
   - RLS 정책 표에는 테이블과 작업(`SELECT`, `INSERT`, `UPDATE`, `DELETE`)의 조합마다 한 행을 쓴다. 정책을 만들지 않아 거부되는 작업도 `허용하지 않음`으로 한 행을 적는다.
   - 정책 행마다 템플릿 표의 열(테이블, 작업, 허용 대상(역할), `USING` 조건, `WITH CHECK` 조건, 근거 FR/AC)을 모두 채운다. 근거에는 `AC-xx`를 하나 이상 넣는다.
   - `USING` 조건은 `SELECT`, `UPDATE`, `DELETE` 행에, `WITH CHECK` 조건은 `INSERT`, `UPDATE` 행에 쓴다. 해당하지 않는 칸에는 `해당 없음`을 쓴다.
6. **`sequence.md`를 쓴다.** 주요 시나리오마다 `sequenceDiagram`을 하나씩 그리고, 관련 `AC-xx`는 시나리오 목록 표에 적는다.
   - 데이터 접근은 항상 shared 함수를 거친다. 서버에서 처리하면 화면, Server Action, shared 함수, Supabase 순서로 그린다.
   - 브라우저에서 직접 데이터를 읽거나 쓰면 화면, shared 함수, Supabase 순서로 그리고, 이때 권한은 RLS가 검사한다는 사실을 메시지로 표시한다.
   - Server Action은 shared 함수를 호출하고 결과를 전달하는 얇은 래퍼로만 그린다.
   - 권한 거부, 입력 검증 실패처럼 AC에 나오는 실패 흐름은 `alt` 블록으로 그린다.
7. **`state.md`를 쓴다(필요할 때만).** `stateDiagram-v2`로 상태와 전이를 그린다. 전이마다 원인이 되는 사용자 동작이나 이벤트를 적고, 상태 값을 저장하는 열이 `erd.md`에 있는지 대조한다.
8. **`screens.md`를 쓴다.** `flowchart`로 화면 이동을 그린다.
   - 노드는 화면이고, 엣지 라벨은 이동 조건(누른 버튼, 로그인 여부 등)이다.
   - 이번 출시에 만들지 않는 화면으로 가는 연결은 `-.->`로 그리고, 다이어그램 아래에 점선이 예정된 연결이라는 범례 문장을 쓴다.
9. **Mermaid 작성 규칙을 지킨다.** GitHub가 렌더링하지 못하는 다이어그램은 설계 문서로 쓸 수 없다.
   - 코드 블록 언어는 `mermaid`로 지정한다.
   - 허용 유형은 `flowchart`, `sequenceDiagram`, `classDiagram`, `erDiagram`, `stateDiagram-v2`, `timeline`, `gantt`뿐이다. `architecture-beta`, `C4Context` 같은 C4 계열, `block-beta`처럼 베타나 실험 단계인 유형은 쓰지 않는다.
   - `flowchart`: 노드 ID는 ASCII로 쓰고 모든 라벨을 큰따옴표로 감싼다. 예: `A["프로젝트 기록"]`, `A -->|"설명"| B`, `subgraph web["apps/web"]` … `end`.
   - `classDiagram`: 클래스 이름은 `Project`, `CounterSet`처럼 ASCII로 쓴다. 한국어 뜻은 note나 아래 표에 쓰거나 `class Project["프로젝트"]` 형식으로 붙인다.
   - `classDiagram` 관계 라벨은 따옴표로 감싼다. 예: `Project "1" --> "*" Counter : "has"`.
   - `erDiagram`: 테이블 이름은 ASCII snake_case로 쓴다. 속성은 `uuid id PK`, `uuid user_id FK`처럼 쓰고, 속성 설명과 관계 라벨은 큰따옴표로 감싼다. 예: `users ||--o{ projects : "owns"`.
   - `stateDiagram-v2`: 상태 ID는 ASCII로 쓰고 `state "진행 중" as InProgress`처럼 한국어 라벨을 붙인다. 전이는 `InProgress --> Done : 완성`처럼 쓴다.
   - `sequenceDiagram`: 참여자는 `participant Web as 웹 화면`처럼 쓰고 `as` 뒤에 따옴표를 붙이지 않는다. 메시지 문구에는 `;`와 `#`을 쓰지 않는다.
10. **다이어그램마다 설명을 붙인다.** 각 다이어그램 바로 아래에 무엇을 읽어야 하는지 1~3문장이나 짧은 표로 쓴다.
11. **요구사항 추적을 확인한다.** 모든 `FR-xx`와 `AC-xx`가 시퀀스, 화면, ERD, 상태 다이어그램 가운데 하나 이상에 나타나는지 확인한다.
    - 요구사항에 없는 동작을 설계에 넣어야 하거나, 요구사항을 바꿔야 설계할 수 있으면 설계를 멈춘다.
    - 이때는 사용자에게 이유를 설명하고 `/sdd-spec`으로 돌아가 요구사항부터 고친다. 설계 문서만 고쳐 요구사항과 다르게 만들지 않는다.
12. **아키텍처 문서를 갱신한다.**
    - `docs/architecture/erd-overview.md`의 전체 ERD에 이번 기능의 테이블과 관계를 추가한다.
    - `docs/architecture/domain-map.md`에 이번 기능의 도메인과 기능 폴더의 대응을 추가한다.
    - 두 문서의 기존 형식과 다이어그램 유형을 유지하고, frontmatter의 `updated`를 오늘 날짜로 바꾼다.
13. **헌법 점검을 한다.** `docs/constitution.md`의 원칙마다 한 행씩 판정 표를 만든다. 열은 원칙, 판정(준수, 위반, 해당 없음), 근거(파일과 다이어그램)다. 아래 항목은 헌법 표현과 관계없이 반드시 포함한다.
    - `supabase-js`를 `packages/shared` 밖에서 쓰는 흐름이 없다([ADR-0003](../../../docs/decisions/0003-data-access-boundary.md)).
    - shared 함수가 자체 DTO와 자체 오류 타입만 반환한다([ADR-0003](../../../docs/decisions/0003-data-access-boundary.md)).
    - 모든 테이블과 작업의 조합이 RLS 정책 표에 있다([ADR-0004](../../../docs/decisions/0004-rls-authorization.md)).
    - 회원 식별에 이메일을 쓰지 않는다([ADR-0005](../../../docs/decisions/0005-auth-supabase-social-login.md)).
    - Spring Flyway가 관리할 `commerce` 스키마 테이블을 이 설계에 넣지 않았다([ADR-0006](../../../docs/decisions/0006-migration-ownership.md)).
    - 판매 관련 데이터가 있으면 판매 대비 원칙을 따른다([ADR-0007](../../../docs/decisions/0007-sales-ready-data-model.md)).
    - 구매 대금을 운영자 계좌로 받는 흐름과 충전금·포인트 잔액이 없다([ADR-0009](../../../docs/decisions/0009-payout-via-pg.md)).
    - 아직 출시 단계가 오지 않은 `apps/api`나 `apps/mobile`을 전제로 설계하지 않았다([ADR-0001](../../../docs/decisions/0001-monorepo-structure.md)).
    - 모든 다이어그램이 허용 유형과 9단계 규칙을 따른다([ADR-0010](../../../docs/decisions/0010-sdd-diagram-first.md)).
    - 판정이 `위반`인 행이 있으면 설계를 고치고 다시 점검한다. 원칙 자체를 바꿔야 한다고 판단하면 새 ADR을 제안하고, ADR이 확정될 때까지 승인을 요청하지 않는다.
14. **문장을 점검한다.** 바꾼 설계 문서와 아키텍처 문서에 `korean-refine` 검사기를 `--style plain`으로 실행하고 지적을 모두 고친다.
15. **승인을 요청한다.** 바꾼 파일 목록, 다이어그램 목록, 새로 추가하는 테이블과 정책 수, 13단계 헌법 점검 표를 사용자에게 보여 준다. 질문 방법은 '게이트' 절을 따른다.
16. **승인을 반영한다.**
    - 설계 파일의 frontmatter를 `status: approved`, `updated: <오늘 날짜>`로 바꾼다.
    - 아래 '명령 모음'으로 Feature 항목의 `SDD 단계`를 `작업 분해`로 바꾼다.
    - 다음 단계로 `/sdd-tasks`를 실행하라고 사용자에게 안내한다.

### 명령 모음

명령 안의 `<...>`와 `NNN`은 실제 값으로 바꾼다. `--jq`를 지원하지 않는 `gh` 버전이면 `--jq` 부분을 빼고 JSON 출력에서 같은 키를 찾는다.

```bash
# 1. Feature 이슈 번호를 찾는다
gh issue list --state all --limit 200 --json number,title,state --jq '.[] | select(.title | startswith("[NNN]"))'

# 2. 프로젝트 번호(number)와 ID(id)를 찾는다
gh project list --owner @me --format json --jq '.projects[] | select(.title == "함뜨까") | {number, id}'

# 3. SDD 단계 필드 ID와 선택지 ID를 찾는다
gh project field-list <projectNo> --owner @me --format json --jq '.fields[] | select(.name == "SDD 단계") | {id, options}'

# 4. Feature 이슈에 해당하는 Project 항목 ID를 찾는다
gh project item-list <projectNo> --owner @me --format json --limit 500 --jq '.items[] | select(.content.number == <FeatureNo>) | .id'

# 5. SDD 단계를 '작업 분해'로 바꾼다
gh project item-edit --id <itemId> --project-id <projectId> --field-id <fieldId> --single-select-option-id <optionId>
```

## 산출물

| 산출물 | 위치 | 마친 뒤 상태 |
|---|---|---|
| 도메인 다이어그램 | `design/domain.md` | `status: approved` |
| ERD와 RLS 정책 표 | `design/erd.md` | `status: approved` |
| 시나리오별 시퀀스 다이어그램 | `design/sequence.md` | `status: approved` |
| 상태 다이어그램(상태가 있을 때만) | `design/state.md` | `status: approved` |
| 화면 이동 다이어그램 | `design/screens.md` | `status: approved` |
| 전체 ERD | `docs/architecture/erd-overview.md` | 이번 기능의 테이블 반영 |
| 도메인 지도 | `docs/architecture/domain-map.md` | 이번 기능의 도메인 반영 |
| Feature 이슈 | GitHub 이슈 | `SDD 단계` = `작업 분해` |

## 게이트

다음 단계인 `/sdd-tasks`로 넘어가려면 사용자가 설계를 명시적으로 승인해야 한다.

- 승인을 요청하기 전에 11단계 요구사항 추적과 13단계 헌법 점검에서 어긋난 항목이 없어야 한다.
- `AskUserQuestion`으로 질문 하나를 보낸다. 질문 문구는 `설계를 승인하시겠습니까?`로 하고, 선택지는 `승인`과 `수정 요청` 두 개로 한다.
- 사용자가 `승인`을 고른 경우에만 16단계를 진행한다. 승인 여부가 분명하지 않은 답은 승인으로 보지 않고 다시 묻는다.
- 수정 요청이 요구사항을 바꾸는 내용이면 설계를 고치지 않고 `/sdd-spec`으로 돌아간다. 요구사항이 다시 승인된 뒤 이 스킬을 처음부터 실행한다.

## 금지 사항

- 요구사항이 `approved`가 아닌 상태에서 설계를 시작하지 않는다.
- `plan.md`, `data-model.md`, `tasks.md`처럼 템플릿에 없는 설계 파일을 만들지 않는다.
- 허용 유형이 아닌 Mermaid 다이어그램이나 이미지 파일로 설계를 대신하지 않는다.
- 요구사항에 없는 기능을 설계에 넣지 않는다. 필요하면 요구사항부터 고친다.
- RLS 정책 표 없이 테이블을 추가하지 않는다.
- `commerce` 스키마 테이블, 마이그레이션 파일, 코드를 이 단계에서 만들지 않는다.
- 승인을 받기 전에 `status`를 `approved`로 바꾸거나 `SDD 단계`를 바꾸지 않는다.
- 사용자가 요청하지 않으면 커밋하거나 푸시하지 않는다. 요청을 받으면 `docs/<이슈번호>-<slug>` 브랜치에서 작업한다.

## 참고 문서

- [SDD 진행 가이드](../../../docs/sdd-guide.md): 다이어그램별 역할과 설계 게이트의 이유
- [프로젝트 헌법](../../../docs/constitution.md)
- 설계 템플릿: [domain](../../../docs/specs/_template/design/domain.md), [erd](../../../docs/specs/_template/design/erd.md), [sequence](../../../docs/specs/_template/design/sequence.md), [state](../../../docs/specs/_template/design/state.md), [screens](../../../docs/specs/_template/design/screens.md)
- [전체 ERD](../../../docs/architecture/erd-overview.md), [도메인 지도](../../../docs/architecture/domain-map.md)
- [ADR-0003 Supabase 접근을 packages/shared로 제한](../../../docs/decisions/0003-data-access-boundary.md)
- [ADR-0004 RLS를 1차 권한 검사로 사용](../../../docs/decisions/0004-rls-authorization.md)
- [ADR-0006 DB 마이그레이션 소유권을 스키마별로 분리](../../../docs/decisions/0006-migration-ownership.md)
- 이전 단계: [sdd-spec 스킬](../sdd-spec/SKILL.md), 다음 단계: [sdd-tasks 스킬](../sdd-tasks/SKILL.md)
