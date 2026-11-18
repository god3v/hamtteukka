---
name: sdd-tasks
description: 요구사항과 설계가 모두 승인된 기능을 PR 하나 크기의 Task로 나누고, 수용 기준 누락과 쓰이지 않은 설계 요소와 헌법 위반을 분석한 뒤, 사용자 확인을 받아 gh CLI로 GitHub Task 이슈를 만들 때 사용한다.
---

# 작업 분해 (/sdd-tasks)

이 스킬은 승인된 요구사항과 설계를 Task 목록으로 나누고, 정합성을 분석한 뒤 GitHub Task 이슈로 등록하는 실행 절차를 정한다. 절차를 마치면 Feature 이슈 아래에 하위 Task 이슈가 생기고, Feature 이슈에 분석 결과 댓글이 남으며, Feature 항목의 `SDD 단계`가 `구현`으로 바뀐다.

`tasks.md`는 만들지 않으며 작업 목록은 GitHub 이슈로만 관리한다. Task를 PR 하나 크기로 나누는 이유는 [SDD 진행 가이드](../../../docs/sdd-guide.md)와 [ADR-0011](../../../docs/decisions/0011-github-issues-projects.md)이 설명한다.

## 입력

| 입력 | 위치 | 확인할 내용 |
|---|---|---|
| 요구사항 | `docs/specs/NNN-<kebab>/requirements.md` | `status: approved`, 모든 `AC-xx` |
| 설계 | `docs/specs/NNN-<kebab>/design/*.md` | `status: approved`, 테이블, RLS 정책, 함수, 시나리오, 화면, 상태 |
| 헌법 | [constitution.md](../../../docs/constitution.md) | Task 범위가 어기면 안 되는 원칙 |
| Feature 이슈 | GitHub, 제목 `[NNN] ...` | 이슈 번호와 기존 하위 Task |
| Task 이슈 양식 | [task.yml](../../../.github/ISSUE_TEMPLATE/task.yml) | Task 본문의 절 이름과 순서 |

### 명령 실행 환경

- 이 스킬의 명령은 Bash 문법으로 적었다. Windows PowerShell 5.1은 네이티브 프로그램에 넘기는 인수 안의 큰따옴표를 지워 `--jq` 식이 깨지므로, Bash 도구에서 실행한다.
- `gh`가 PATH에 없으면 Windows에서는 `"/c/Program Files/GitHub CLI/gh.exe"`(Bash)나 `& "C:\Program Files\GitHub CLI\gh.exe"`(PowerShell)로 실행한다.
- `--project` 옵션과 `gh project` 명령은 토큰에 `project` 권한(scope)이 있어야 동작한다. `gh auth status`에 없으면 사용자에게 `gh auth refresh -s project` 실행을 요청한다.
- 이슈 본문과 댓글은 Write 도구로 저장소 밖 임시 파일(세션 scratchpad 등)에 UTF-8로 쓴 뒤 `<tmp>` 자리에 그 경로를 넣는다.

## 절차

1. **승인 상태를 확인한다.** `requirements.md`와 `design/*.md`의 frontmatter `status`가 모두 `approved`인지 확인한다. 하나라도 아니면 멈추고 `/sdd-spec`이나 `/sdd-design`을 먼저 마치라고 사용자에게 알린다.
2. **Feature 이슈와 기존 Task를 확인한다.**
   - '명령 모음'의 1번 명령으로 Feature 이슈 번호를 찾는다.
   - 2번 명령으로 Feature의 하위 이슈 목록을 가져온다.
   - 하위 Task가 이미 있으면 이번 분해 결과와 비교해 새로 만들 Task, 그대로 둘 Task, 더 필요 없는 Task로 나눈다.
3. **Task를 나눈다.**
   - Task 하나는 PR 하나로 끝낸다. 변경 줄 수가 200줄 미만이 되도록 나누는 것을 목표로 한다.
   - 기본 순서는 마이그레이션과 RLS 정책, shared DTO와 함수와 테스트, Server Action과 화면이다. 앞 Task의 결과가 필요한 Task에는 선행 Task를 적는다.
   - Task마다 제목, 다루는 `AC-xx`, 쓰는 설계 요소, 선행 Task, `area:` 라벨, Size 제안 값, 범위 밖 항목을 정한다.
   - 제목은 `[NNN] <한국어 요약>` 형식으로 쓴다.
   - Size는 `S`, `M`, `L`, `XL` 가운데 하나를 제안한다. `XL`로 보이는 Task는 더 작게 나눌 수 있는지 먼저 검토한다.
4. **정합성을 분석한다.** 아래 표의 점검을 모두 실행하고 결과를 기록한다.

   | 점검 | 방법 | 통과 조건 |
   |---|---|---|
   | 수용 기준 누락 | 요구사항의 모든 `AC-xx`를 Task의 AC 목록과 대조한다 | 모든 AC가 Task 하나 이상에 있다 |
   | 쓰이지 않은 설계 요소 | 테이블, RLS 정책 행, 클래스와 함수, 시퀀스 시나리오, 화면, 상태 전이를 Task와 대조한다 | 모든 요소가 Task 하나 이상에 있다 |
   | 헌법 위반 | Task 범위를 헌법과 ADR에 대조한다 | 위반이 없다 |
   | AC 없는 Task | Task마다 AC 목록을 확인한다 | 설정이나 기반 작업이면 이유를 적었다 |
   | 크기 | Task마다 예상 변경 줄 수를 추정한다 | 200줄을 넘을 Task는 나눴거나 이유를 적었다 |
   | 의존 순환 | 선행 Task 관계를 따라간다 | 순환이 없다 |

   - 빠진 AC가 있으면 Task를 추가하거나 기존 Task의 범위를 넓힌다.
   - 쓰이지 않은 설계 요소가 있으면 Task를 추가한다. 그 요소가 필요 없다고 판단하면 `/sdd-design`으로 돌아가 설계에서 먼저 지운다.
   - 요구사항이나 설계가 서로 모순되면 Task로 메우지 않는다. 사용자에게 알리고 `/sdd-spec`이나 `/sdd-design`으로 돌아간다.
5. **목록을 보여 주고 확인을 받는다.** 아래 형식의 표와 4단계 분석 결과를 사용자에게 보여 준다. 질문 방법은 '게이트' 절을 따른다.

   | 순서 | 제목 | AC | 설계 요소 | 선행 | 라벨 | Size |
   |---|---|---|---|---|---|---|
   | 1 | `[NNN] <요약>` | AC-01, AC-02 | `erd.md` 테이블, 정책 | 없음 | `area:<영역>` | M |

6. **이슈를 만든다.** 선행 Task가 없는 Task부터 순서대로 만든다.
   - Task마다 'Task 이슈 본문' 형식으로 임시 파일을 쓰고 3번 명령을 실행한다.
   - 출력된 이슈 URL 끝의 번호를 기록하고, 뒤에 만드는 Task의 `--blocked-by` 값으로 쓴다.
   - 선행 Task가 둘 이상이면 하나는 `--blocked-by`로 넣고, 나머지는 4번 명령으로 추가한다.
   - 2단계에서 같은 제목의 Task가 이미 있으면 새로 만들지 않는다.
   - 더 필요 없는 기존 Task는 사용자가 확인한 경우에만 5번 명령으로 닫는다.
7. **Project 필드를 설정한다.** 6~9번 명령으로 아래 값을 설정한다.
   - 새 Task 항목: `Status`는 `Todo`, `Size`는 5단계에서 확인한 값으로 설정한다.
   - Feature 항목: `SDD 단계`를 `구현`으로 바꾼다.
8. **분석 결과를 Feature 이슈 댓글로 남긴다.** 댓글에는 만든 Task 표(이슈 번호 포함), AC와 Task의 대응표, 4단계 점검 결과를 넣는다. 10번 명령으로 남긴다.
9. **결과를 보고한다.** 만든 이슈 번호, 선행 Task가 없어 바로 시작할 수 있는 Task, 다음 명령(`/sdd-implement #<이슈번호>`)을 사용자에게 알린다.

### Task 이슈 본문

본문은 [task.yml](../../../.github/ISSUE_TEMPLATE/task.yml) 양식과 같은 절을 같은 순서로 쓰고, 절을 하나도 빼지 않는다. 양식으로 만든 이슈와 구조가 같도록 절 제목은 `###`로 쓴다. `/sdd-implement`는 이 절 이름으로 관련 문서, 다루는 AC, 선행 Task를 읽는다.

```markdown
### 상위 Feature
#<FeatureNo>

### 관련 문서
- 요구사항: docs/specs/NNN-<kebab>/requirements.md
- 설계: docs/specs/NNN-<kebab>/design/<파일>.md

### 다루는 수용 기준
- NNN/AC-xx: <수용 기준 요약>

### 작업 범위
- <바꿀 영역과 파일>

### 범위 밖
- <이 Task에서 하지 않는 일, 없으면 "없음">

### 선행 Task
#<n> (없으면 "없음")

### 완료 조건
- [ ] 다루는 수용 기준에 적은 AC를 모두 구현했다
- [ ] AC를 확인하는 테스트 이름에 기능 번호와 AC ID를 넣었다(예 003/AC-04)
- [ ] typecheck가 통과한다
- [ ] lint가 통과한다
- [ ] test가 통과한다
- [ ] 설계와 다르게 구현해야 했다면 설계 문서를 먼저 고쳤다
```

### 명령 모음

명령 안의 `<...>`와 `NNN`은 실제 값으로 바꾼다. 3번 명령의 `[--blocked-by <n>]`은 선행 Task가 있을 때만 대괄호를 빼고 붙인다. `--jq`를 지원하지 않는 `gh` 버전이면 `--jq` 부분을 빼고 JSON 출력에서 같은 키를 찾는다.

```bash
# 1. Feature 이슈 번호를 찾는다
gh issue list --state all --limit 200 --json number,title,state --jq '.[] | select(.title | startswith("[NNN]"))'

# 2. Feature의 하위 이슈 목록을 가져온다
gh api "repos/{owner}/{repo}/issues/<FeatureNo>/sub_issues" --paginate --jq '.[] | {number, title, state}'

# 3. Task 이슈를 만든다
gh issue create --title "[NNN] <Task 제목>" --body-file <tmp> --type Task --parent <FeatureNo> --milestone "<마일스톤>" --label "area:<영역>" --project "함뜨까" [--blocked-by <n>]

# 4. 선행 Task를 추가로 연결한다
gh issue edit <n> --add-blocked-by <m>

# 5. 더 필요 없는 Task를 닫는다 (사용자 확인 뒤에만)
gh issue close <n> --reason "not planned" --comment "<닫는 이유>"

# 6. 프로젝트 번호(number)와 ID(id)를 찾는다
gh project list --owner @me --format json --jq '.projects[] | select(.title == "함뜨까") | {number, id}'

# 7. Status, Size, SDD 단계 필드 ID와 선택지 ID를 찾는다
gh project field-list <projectNo> --owner @me --format json --jq '.fields[] | select(.name == "Status" or .name == "Size" or .name == "SDD 단계") | {name, id, options}'

# 8. 이슈에 해당하는 Project 항목 ID를 찾는다
gh project item-list <projectNo> --owner @me --format json --limit 500 --jq '.items[] | select(.content.number == <issueNo>) | .id'

# 9. 필드 값을 설정한다 (필드마다 한 번씩)
gh project item-edit --id <itemId> --project-id <projectId> --field-id <fieldId> --single-select-option-id <optionId>

# 10. Feature 이슈에 분석 결과 댓글을 남긴다
gh issue comment <FeatureNo> --body-file <tmp>
```

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

라벨은 아래 목록에서 Task가 바꾸는 영역에 맞는 것을 하나 고른다. 기능 폴더 `001`은 `area:account`, `002`는 `area:project`, `003`은 `area:counter`, `004`는 `area:pattern-file`에 대응한다.

- 공통: `area:infra`, `area:docs`
- R0~R1 기능: `area:account`, `area:project`, `area:counter`, `area:pattern-file`
- R2 이후 기능: `area:pattern-store`, `area:discovery`, `area:community`, `area:moderation`, `area:commerce`, `area:app`

## 산출물

| 산출물 | 위치 | 마친 뒤 상태 |
|---|---|---|
| Task 이슈 | GitHub, Feature의 하위 이슈 | 타입 `Task`, 마일스톤과 라벨 지정, `Status` = `Todo`, `Size` 지정 |
| 선행 관계 | Task 이슈의 blocked-by 연결 | 5단계 표와 같음 |
| 분석 결과 댓글 | Feature 이슈 댓글 | Task 표, AC 대응표, 점검 결과 |
| Feature 이슈 | GitHub 이슈 | `SDD 단계` = `구현` |

## 게이트

이슈를 만들기 전에 사용자가 Task 목록을 확인해야 한다.

- 4단계 점검에서 통과하지 못한 항목이 있으면 확인을 요청하지 않는다. 먼저 Task를 고치거나 상위 단계로 돌아간다.
- `AskUserQuestion`으로 질문 하나를 보낸다. 질문 문구는 `이 Task 목록으로 이슈를 만드시겠습니까?`로 하고, 선택지는 `이대로 생성`과 `수정 요청` 두 개로 한다.
- 사용자가 `이대로 생성`을 고른 경우에만 6단계를 진행한다.
- 수정 요청을 반영해 목록이 바뀌면 4단계 분석을 다시 실행하고 다시 확인을 받는다.

## 금지 사항

- `tasks.md`나 Task 목록을 담은 다른 파일을 저장소에 만들지 않는다.
- 요구사항이나 설계와 다른 내용을 Task 본문에만 적지 않는다. 상위 문서를 먼저 고친다.
- 사용자 확인 전에 이슈를 만들거나 닫지 않는다.
- PR 하나로 끝낼 수 없는 Task를 만들지 않는다.
- 이슈 본문 임시 파일을 저장소 안에 만들지 않는다.
- `Status`를 `Done`으로 직접 바꾸지 않는다. 이슈가 닫히면 Project 자동화가 바꾼다.
- 이 단계에서 브랜치를 만들거나 코드를 쓰지 않는다.

## 참고 문서

- [SDD 진행 가이드](../../../docs/sdd-guide.md): 작업 분해 기준과 분석 단계의 이유
- [프로젝트 헌법](../../../docs/constitution.md)
- [ADR-0011 GitHub Issues·Projects로 업무 관리](../../../docs/decisions/0011-github-issues-projects.md)
- [Task 이슈 양식](../../../.github/ISSUE_TEMPLATE/task.yml)
- 이전 단계: [sdd-design 스킬](../sdd-design/SKILL.md), 다음 단계: [sdd-implement 스킬](../sdd-implement/SKILL.md)
