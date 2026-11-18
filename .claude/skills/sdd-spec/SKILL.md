---
name: sdd-spec
description: 새 테이블이나 새 화면을 추가하거나 권한 규칙을 바꾸는 기능에서 요구사항 문서 docs/specs/NNN-이름/requirements.md를 새로 만들거나, 이미 있는 요구사항의 확인 질문을 해결하고 사용자 승인을 받을 때 사용한다.
---

# 요구사항 작성 (/sdd-spec)

이 스킬은 기능 하나의 요구사항 문서를 템플릿으로 만들고, 확인 질문으로 빈틈을 메운 뒤 사용자 승인을 받는 실행 절차를 정한다. 절차를 마치면 승인된 `requirements.md`가 남고, GitHub Project `함뜨까`에서 해당 Feature 이슈의 `SDD 단계`가 `설계`로 바뀐다.

단계를 나눈 이유와 각 산출물의 역할은 [SDD 진행 가이드](../../../docs/sdd-guide.md)가 설명한다. 이 스킬에는 실행할 순서와 명령만 적는다.

## 입력

| 입력 | 위치 | 확인할 내용 |
|---|---|---|
| 기능 설명 | 사용자 메시지나 스킬 인수 | 만들 기능과 대상 사용자 |
| 기능 목록 | [feature-catalog.md](../../../docs/product/feature-catalog.md) | 기능 ID(`F-...`)와 출시 단계 |
| 로드맵 | [roadmap.md](../../../docs/product/roadmap.md) | 진행 중인 출시 단계와 범위 |
| 미결정 항목 | [decisions/README.md](../../../docs/decisions/README.md) | 이 기능과 관련된 `OD-xx` |
| 헌법 | [constitution.md](../../../docs/constitution.md) | 요구사항이 어기면 안 되는 원칙 |
| 템플릿 | [_template/requirements.md](../../../docs/specs/_template/requirements.md) | 문서 구조와 frontmatter |
| 기존 명세 | `docs/specs/NNN-*/` | 다음 번호와 중복 기능 |

### 명령 실행 환경

- 이 스킬의 명령은 Bash 문법으로 적었다. Windows PowerShell 5.1은 네이티브 프로그램에 넘기는 인수 안의 큰따옴표를 지워 `--jq` 식이 깨지므로, Bash 도구에서 실행한다.
- `gh`가 PATH에 없으면 Windows에서는 `"/c/Program Files/GitHub CLI/gh.exe"`(Bash)나 `& "C:\Program Files\GitHub CLI\gh.exe"`(PowerShell)로 실행한다.
- Project 필드를 바꾸려면 토큰에 `project` 권한(scope)이 있어야 한다. `gh auth status`에 없으면 사용자에게 `gh auth refresh -s project` 실행을 요청한다. 이 명령은 브라우저 인증을 거치므로 사용자가 직접 실행한다.

## 절차

1. **SDD 적용 대상인지 확인한다.** 새 테이블 추가, 새 화면 추가, 권한 규칙 변경 가운데 하나라도 해당하면 계속한다. 셋 다 해당하지 않는 버그 수정, 문구 수정, 리팩터링이면 스킬을 멈추고 SDD 없이 PR로 바로 처리하자고 사용자에게 알린다. 이슈가 필요한지는 [ADR-0012](../../../docs/decisions/0012-issue-for-planned-work-only.md)를 따른다.
2. **기능 폴더와 번호를 정한다.**
   - `docs/specs/` 아래에서 이름이 숫자 세 자리와 하이픈으로 시작하는 폴더를 모두 찾는다. `_template` 폴더는 제외한다.
   - 같은 기능의 폴더가 이미 있으면 새로 만들지 않는다. 그 폴더의 `requirements.md`를 열고 4단계부터 진행한다.
   - 이미 `approved`인 요구사항을 고치는 경우에는 `status`를 `review`로 되돌리고 승인을 다시 받는다. 승인 뒤에는 설계와 Task를 `/sdd-design`, `/sdd-tasks`로 다시 맞춘다.
   - 새 기능이면 가장 큰 번호에 1을 더하고 세 자리로 맞춘다. 폴더가 `001`부터 `004`까지 있으면 다음 번호는 `005`다.
   - 번호 뒤의 이름은 기능을 나타내는 짧은 영어 kebab-case로 짓는다. 기존 예는 `003-row-counter`다.
3. **템플릿을 복사하고 frontmatter를 채운다.**
   - `docs/specs/_template/requirements.md`를 `docs/specs/NNN-<kebab>/requirements.md`로 복사한다.
   - frontmatter에 `status: review`, `updated: <오늘 날짜>`, `feature: NNN-<kebab>`, `release: <출시 코드>`, `features: [F-...]`를 적는다.
   - 출시 코드와 기능 ID는 기능 목록과 로드맵에서 가져온다. 목록에 없는 기능이면 출시 단계를 사용자에게 묻는다.
   - 리드나 상태와 승인 절의 첫 문단에는 이 문서가 승인을 기다리는 제안이라는 사실과, 승인되면 설계 단계의 기준 문서가 된다는 사실을 적는다.
4. **Feature 이슈를 확인한다.**
   - 아래 '명령 모음'의 1번 명령으로 제목이 `[NNN]`으로 시작하는 이슈를 찾는다.
   - 없으면 2번 명령과 제목, 마일스톤, 라벨을 사용자에게 보여 주고, 동의를 받은 뒤에 만든다. Feature 제목 형식은 `[001] 계정: 가입·로그인·약관 동의·탈퇴`와 같다.
   - Feature 항목의 `SDD 단계`가 비어 있으면 3~6번 명령으로 `요구사항`을 설정한다.
5. **초안을 쓴다.** 템플릿의 절 순서와 ID 형식을 그대로 따른다. 각 절의 형식은 아래와 같다.
   - **상태와 승인**: 승인 대기 안내 문장 아래에 `항목`, `값` 두 열의 표를 둔다. 행은 `상태`, `출시 단계`, `기능 ID`, `Feature 이슈`, `승인 위치`, `선행 명세`, `연결된 미결정 항목`, `승인 조건`, `승인 후 단계` 순서로 9개를 모두 쓴다.
   - 상태 행의 값은 검토 대기 (`review`)로 쓴다. 해당하지 않는 행은 지우지 않고 값에 `없음`을 쓴다.
   - **사용자 스토리**: 표의 열은 `ID`, `사용자`, `원하는 일`, `이유`, `기능 ID` 다섯 개다. 기능 ID 칸에는 그 스토리를 다루는 `F-...` ID를 쓰고, 둘 이상이면 쉼표로 나눈다.
   - 사용자 스토리(`US-xx`)에는 사용자가 무엇을 왜 하려는지만 쓴다. Next.js, Supabase, 테이블, API, RLS, 컴포넌트처럼 기술 스택이나 구현을 가리키는 말을 쓰지 않는다.
   - 카카오 로그인처럼 사용자가 화면에서 직접 보는 서비스 이름은 사용자 스토리에 쓸 수 있다.
   - 기능 요구사항(`FR-xx`)에는 시스템이 해야 하는 동작을 한 항목에 하나씩 쓴다.
   - 비기능 요구사항(`NFR-xx`)에는 확인할 방법이 있는 조건만 쓴다. 수치는 사용자 답변이나 확정된 결정에서 나온 값만 쓰고, 정해지지 않은 수치는 확인 질문으로 만든다.
   - **수용 기준**: AC마다 `### AC-xx 제목` 아래에 `관련 항목: FR-xx, ...` 줄을 두고, 그 줄에 검증하는 `FR-xx`나 `NFR-xx`를 적는다. 그 아래에 `**Given**`, `**When**`, `**Then**`으로 시작하는 목록 세 줄을 쓴다.
   - 수용 기준은 자동 테스트나 명시한 수동 확인으로 판정할 수 있어야 한다.
   - 이번 기능에서 하지 않는 일은 범위 밖 절에 적는다.
   - **확인 질문**: 판단할 근거가 없는 지점은 `Q-xx`로 적고 상태를 `열림`으로 둔다. 질문 표의 열은 `ID`, `질문`, `선택지와 제안`, `관련 항목`, `상태` 다섯 개이고, 상태 칸에는 `열림`이나 `해결`만 쓴다.
   - 선택지와 제안 칸은 짧게 쓴다. 참고할 사실이나 제안 이유가 길면 질문 표 아래 `### 질문 상세` 절을 두고, 질문마다 `#### Q-xx 요약` 블록에 쓴다. 질문 상세 절은 필요할 때만 둔다.
   - 질문 표 아래에는 `### 해결 기록` 절을 두고, `날짜`, `ID`, `결정`, `고친 항목` 네 열의 표를 쓴다. 해결한 질문이 아직 없으면 `| - | - | - | - |` 한 행만 둔다.
6. **확인 라운드를 진행한다.** 한 라운드에서는 열린 질문을 최대 5개까지 묻는다.
   - 결과에 주는 영향이 큰 질문부터 고른다. 데이터 구조, 권한, 법적 의무, 화면 흐름 순서로 영향이 크다고 본다.
   - `AskUserQuestion` 도구로 묻는다. 질문마다 선택지를 2개 이상 주고, 추천안을 첫 번째에 두고 `(추천)`을 붙인다.
   - 선택지 설명에는 그 안을 고르면 어떤 `FR-xx`나 `AC-xx`가 어떻게 바뀌는지 적는다.
   - 도구를 한 번 호출할 때 담을 수 있는 질문 수가 5개보다 적으면, 같은 라운드 안에서 나누어 호출한다.
   - 답을 받으면 해결 기록 표에 날짜, `Q-xx` ID, 결정, 고친 항목을 한 행으로 적고, 질문 표에서 그 질문의 상태를 `해결`로 바꾼다. 첫 행을 적을 때는 `| - | - | - | - |` 행을 지운다. 같은 답을 관련 US, FR, NFR, AC에도 반영한다.
   - 고친 항목 칸에는 결정에 따라 고친 US, FR, NFR, AC의 ID를 적는다. 질문 상세 절에 그 질문의 블록이 있으면 지우지 않고 남긴다.
   - 답 때문에 새로 모호해진 지점이 생기면 새 `Q-xx`를 추가한다.
   - 질문이 미결정 항목(`OD-xx`)과 겹치면 `Q-xx`에 OD 번호를 적는다. 사용자가 답하면 그 OD를 ADR로 확정하자고 제안하고, 작성 방법은 [decisions/README.md](../../../docs/decisions/README.md)를 따른다.
   - 열린 질문이 하나도 남지 않을 때까지 라운드를 반복한다. 사용자가 답을 미루면 그 항목을 범위 밖 절로 옮길지 묻고, 동의를 받은 경우에만 옮긴다.
7. **자체 점검을 한다.** 아래 항목을 모두 확인하고, 어긋난 항목은 고친 뒤 다시 확인한다.
   - 모든 `US-xx`에 연결된 `AC-xx`가 하나 이상 있다.
   - 모든 `FR-xx`를 검증하는 `AC-xx`가 하나 이상 있다.
   - 사용자 스토리 절에 기술 스택을 가리키는 말이 없다. `Grep`으로 `Next|Supabase|Postgres|RLS|API|테이블|컴포넌트|Server Action`을 검색해 확인한다.
   - 삭제한 ID의 번호를 다른 항목에 다시 쓰거나, 남은 ID의 번호를 당겨 매기지 않았다.
   - 상태가 `열림`인 `Q-xx`가 없다.
   - 상태와 승인 표의 9개 행, 사용자 스토리 표의 5개 열, 확인 질문 표의 5개 열, 해결 기록 표의 4개 열이 5단계의 형식과 같다.
   - 모든 `AC-xx`에 `관련 항목:` 줄과 굵게 쓴 Given, When, Then이 있다.
   - 문서에 적힌 수치가 모두 사용자 답변이나 확정된 결정에서 나왔다.
   - [CLAUDE.md](../../../CLAUDE.md)의 문서 작성 규칙에 따라 `korean-refine` 검사기를 `--style plain`으로 실행했고 지적이 0건이다.
8. **승인을 요청한다.** frontmatter의 `status`가 `review`인지 확인한 뒤, 문서 경로와 요약을 사용자에게 보여 준다. 요약에는 US, FR, NFR, AC 개수와 해결한 `Q-xx` 개수, 범위 밖 항목을 넣는다. 질문 방법은 '게이트' 절을 따른다.
9. **승인을 반영한다.**
   - frontmatter를 `status: approved`, `updated: <오늘 날짜>`로 바꾼다.
   - 상태와 승인 표의 상태 값을 승인 (`approved`)으로 바꾼다. 나머지 8개 행은 그대로 둔다.
   - 승인 대기 안내 문장을 승인된 기준 문서라는 문장으로 바꾸고 승인 날짜를 적는다.
   - 3~6번 명령으로 Feature 항목의 `SDD 단계`를 `설계`로 바꾼다.
   - 다음 단계로 `/sdd-design`을 실행하라고 사용자에게 안내한다.

### 명령 모음

명령 안의 `<...>`와 `NNN`은 실제 값으로 바꾼다. 이슈 본문은 Write 도구로 저장소 밖 임시 파일(세션 scratchpad 등)에 UTF-8로 쓴 뒤 `<tmp>` 자리에 그 경로를 넣는다.

```bash
# 1. 제목이 [NNN]으로 시작하는 Feature 이슈를 찾는다
gh issue list --state all --limit 200 --json number,title,state --jq '.[] | select(.title | startswith("[NNN]"))'

# 2. Feature 이슈가 없고 사용자가 동의했을 때만 만든다
gh issue create --title "[NNN] <기능 제목>" --body-file <tmp> --type Feature --milestone "<마일스톤>" --label "area:<영역>" --project "함뜨까"

# 3. 프로젝트 번호(number)와 ID(id)를 찾는다
gh project list --owner @me --format json --jq '.projects[] | select(.title == "함뜨까") | {number, id}'

# 4. SDD 단계 필드 ID와 선택지 ID를 찾는다
gh project field-list <projectNo> --owner @me --format json --jq '.fields[] | select(.name == "SDD 단계") | {id, options}'

# 5. Feature 이슈에 해당하는 Project 항목 ID를 찾는다
gh project item-list <projectNo> --owner @me --format json --limit 500 --jq '.items[] | select(.content.number == <FeatureNo>) | .id'

# 6. SDD 단계 값을 바꾼다
gh project item-edit --id <itemId> --project-id <projectId> --field-id <fieldId> --single-select-option-id <optionId>
```

`--jq`를 지원하지 않는 `gh` 버전이면 `--jq` 부분을 빼고 JSON 출력에서 같은 키를 찾는다. Feature 본문에는 요구사항 문서 경로와 기능 ID 목록을 적는다.

마일스톤은 요구사항 frontmatter의 `release` 값으로 고른다.

| 출시 코드 | 마일스톤 이름 |
|---|---|
| R0 | R0 기반 |
| R1 | R1 MVP |
| R1+ | R1+ 도구 보강 |
| R2 | R2 무료 도안 배포 |
| R3 | R3 커뮤니티 |
| R4 | R4 유료 판매 |
| A1 | A1 앱 |

라벨은 기능 영역에 맞는 `area:` 라벨 하나를 고른다. 기능 폴더 `001`~`004`에 대응하는 라벨과 전체 라벨 목록은 [sdd-tasks 스킬](../sdd-tasks/SKILL.md)의 명령 모음 절에 있다.

## 산출물

| 산출물 | 위치 | 마친 뒤 상태 |
|---|---|---|
| 요구사항 문서 | `docs/specs/NNN-<kebab>/requirements.md` | `status: approved` |
| 확인 질문 기록 | 요구사항 문서의 `Q-xx` 표와 해결 기록 표 | 모든 질문 `해결`, 해결한 질문마다 해결 기록 한 행 |
| Feature 이슈 | GitHub 이슈, 제목 `[NNN] <기능 제목>` | `SDD 단계` = `설계` |

## 게이트

다음 단계인 `/sdd-design`으로 넘어가려면 사용자가 요구사항을 명시적으로 승인해야 한다.

- 승인을 요청하기 전에 열린 `Q-xx`가 없고, 7단계 자체 점검을 통과했고, `status`가 `review`여야 한다.
- `AskUserQuestion`으로 질문 하나를 보낸다. 질문 문구는 `요구사항을 승인하시겠습니까?`로 하고, 선택지는 `승인`과 `수정 요청` 두 개로 한다.
- `수정 요청` 선택지 설명에는 고칠 내용을 함께 적어 달라고 쓴다.
- 사용자가 `승인`을 고른 경우에만 9단계를 진행한다. 승인 여부가 분명하지 않은 답은 승인으로 보지 않고 다시 묻는다.
- 수정 요청을 받으면 문서를 고치고, 새로 생긴 모호한 지점은 확인 라운드로 해결한 뒤 다시 승인을 요청한다.

## 금지 사항

- `spec.md`, `plan.md`, `tasks.md`를 만들지 않는다.
- 사용자 스토리에 기술 스택이나 구현 방식을 쓰지 않는다.
- 사용자가 답하지 않은 수치, 기한, 정책을 추측해서 채우지 않는다.
- 미결정 항목(`OD-xx`)을 사용자 확인 없이 결정된 것처럼 쓰지 않는다.
- 승인을 받기 전에 `status`를 `approved`로 바꾸거나 `SDD 단계`를 `설계`로 바꾸지 않는다.
- 이 단계에서 설계 다이어그램, 마이그레이션, 코드를 만들지 않는다.
- 사용자 동의 없이 Feature 이슈를 만들지 않는다.
- 사용자가 요청하지 않으면 커밋하거나 푸시하지 않는다. 요청을 받으면 `docs/<이슈번호>-<slug>` 브랜치에서 작업한다.

## 참고 문서

- [SDD 진행 가이드](../../../docs/sdd-guide.md): 단계별 목적, 게이트를 둔 이유, SDD 적용 기준
- [프로젝트 헌법](../../../docs/constitution.md)
- [요구사항 템플릿](../../../docs/specs/_template/requirements.md)
- [의사결정 기록과 미결정 항목](../../../docs/decisions/README.md)
- [ADR-0010 카카오페이 흐름 기반 SDD와 다이어그램 중심 설계](../../../docs/decisions/0010-sdd-diagram-first.md)
- [ADR-0011 GitHub Issues·Projects로 업무 관리](../../../docs/decisions/0011-github-issues-projects.md)
- 다음 단계: [sdd-design 스킬](../sdd-design/SKILL.md)
