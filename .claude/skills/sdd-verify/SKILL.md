---
name: sdd-verify
description: Feature 이슈의 하위 Task가 병합된 뒤 요구사항의 모든 수용 기준과 설계를 실제 코드와 테스트에 대조하고, 빈틈은 새 Task 이슈로 만들며, 빈틈이 없으면 SDD 단계를 검증으로 바꾸고 Feature 이슈를 닫을 때 사용한다.
---

# 기능 검증 (/sdd-verify)

이 스킬은 Feature 하나의 병합된 코드를 요구사항의 수용 기준과 설계 다이어그램에 대조하고, 결과에 따라 빈틈 Task를 만들거나 Feature를 닫는 실행 절차를 정한다. 절차를 마치면 AC별 판정 보고서가 Feature 이슈 댓글로 남고, 빈틈이 있으면 새 Task 이슈가 생기며, 빈틈이 없으면 Feature가 `SDD 단계` = `검증` 상태로 닫힌다.

판정 근거는 에이전트의 자기 보고가 아니라 typecheck, lint, test의 실제 실행 결과와 코드다. 검증 단계를 두는 이유는 [SDD 진행 가이드](../../../docs/sdd-guide.md)가 설명한다.

## 입력

| 입력 | 위치 | 확인할 내용 |
|---|---|---|
| Feature 이슈 번호 | 스킬 인수(예: `/sdd-verify 7`) | 인수가 없으면 사용자에게 묻는다 |
| 요구사항 | Feature 제목의 `[NNN]`에 해당하는 `docs/specs/NNN-<kebab>/requirements.md` | 모든 `AC-xx`와 `NFR-xx` |
| 설계 | `docs/specs/NNN-<kebab>/design/*.md` | 테이블, RLS 정책 표, shared 함수, 시나리오, 화면, 상태 |
| 하위 Task와 PR | GitHub | 닫힌 이유, 병합된 PR |
| 코드 | 최신 `main`의 `apps/web`, `packages/shared`, `supabase/` | 구현 위치와 `NNN/AC-xx` 테스트 |
| 헌법 | [constitution.md](../../../docs/constitution.md) | 판정에 쓸 원칙 |

### 명령 실행 환경

- 이 스킬의 명령은 Bash 문법으로 적었다. Windows PowerShell 5.1은 네이티브 프로그램에 넘기는 인수 안의 큰따옴표를 지워 `--jq` 식이 깨지므로, Bash 도구에서 실행한다.
- `gh`가 PATH에 없으면 Windows에서는 `"/c/Program Files/GitHub CLI/gh.exe"`(Bash)나 `& "C:\Program Files\GitHub CLI\gh.exe"`(PowerShell)로 실행한다.
- `--project` 옵션과 `gh project` 명령은 토큰에 `project` 권한(scope)이 있어야 동작한다. 없으면 사용자에게 `gh auth refresh -s project` 실행을 요청한다.
- 이슈 본문과 댓글은 Write 도구로 저장소 밖 임시 파일(세션 scratchpad 등)에 UTF-8로 쓴 뒤 `<tmp>` 자리에 그 경로를 넣는다.

## 절차

1. **Feature 이슈를 읽는다.** '명령 모음'의 1번 명령으로 이슈를 읽고, 제목의 `[NNN]`으로 기능 폴더를 찾는다. 요구사항과 설계 문서를 모두 읽는다.
2. **하위 Task와 병합된 PR을 모은다.**
   - 2번 명령으로 하위 Task 목록과 상태, 닫힌 이유를 가져온다.
   - 닫힌 Task마다 3번 명령으로 병합된 PR을 찾는다. 브랜치 이름이 `<접두어>/<Task 번호>-`로 시작하거나 본문에 `Closes #<Task 번호>`가 있는 PR을 그 Task의 PR로 본다.
   - 열린 Task가 있으면 목록을 보고하고 최종 판정을 하지 않는다. 사용자가 원하면 중간 점검으로 계속하되, 이때는 `SDD 단계`와 Feature 상태를 바꾸지 않는다.
   - `not planned`로 닫힌 Task가 있으면, 그 Task가 다루던 AC를 다른 Task가 맡았는지 확인한다.
   - 닫혔지만 병합된 PR을 찾지 못한 Task는 빈틈 후보로 기록한다.
3. **최신 `main`을 받는다.** 4번 명령을 실행한다. `git status --porcelain` 출력이 비어 있지 않으면 진행하지 않고 사용자에게 처리 방법을 묻는다.
4. **검사를 실행한다.**
   - 저장소 루트에서 AGENTS.md에 적힌 typecheck, lint, test 명령을 차례로 실행한다. 예: `pnpm typecheck`, `pnpm lint`, `pnpm test`.
   - 출력을 `tail`, `head`, `grep`으로 파이프하지 않고, 실제 출력과 종료 코드를 그대로 보관한다.
   - 실패한 검사는 그 자체로 빈틈으로 기록한다.
5. **AC를 하나씩 대조한다.**
   - `Grep`으로 `NNN/AC-xx` 문자열을 `apps/`, `packages/`, `supabase/` 아래에서 검색해 테스트 위치를 찾는다.
   - 테스트가 AC의 Given, When, Then을 실제로 확인하는지 테스트 코드를 읽어 판단한다. 이름만 맞고 내용이 다르면 `부분`으로 판정한다.
   - 4단계 출력에서 그 테스트가 실행되고 통과했는지 확인한다.
   - 구현 위치(파일과 함수)를 함께 기록한다.
   - 자동 테스트로 확인할 수 없는 AC와 NFR은 확인 방법을 적고 사용자에게 확인을 요청한다. 사용자의 답을 받기 전에는 `충족`으로 판정하지 않는다.
   - 판정은 `충족`, `부분`, `누락` 가운데 하나로 한다.
6. **설계와 코드를 대조한다.** 아래 항목마다 일치 여부와 근거 위치를 기록한다.
   - `erd.md`의 테이블과 열이 `supabase/migrations`에 있다.
   - `erd.md` RLS 정책 표의 행마다 마이그레이션에 같은 작업, 역할, `USING` 조건, `WITH CHECK` 조건의 정책이 있다. `허용하지 않음`으로 적은 작업에 정책이 생기지 않았다.
   - `domain.md`의 shared 함수와 DTO가 `packages/shared`에 있고, Supabase 타입을 밖으로 노출하지 않는다.
   - `sequence.md`의 흐름대로 Server Action과 화면이 shared 함수를 거쳐 데이터에 접근한다.
   - `screens.md`의 화면과 이동 조건이 `apps/web`의 라우트에 있다.
   - `state.md`가 있으면 상태 전이가 코드에 같은 조건으로 구현되어 있다.
   - `docs/architecture/erd-overview.md`와 `domain-map.md`에 이 기능의 테이블과 도메인이 반영되어 있다.
7. **보고서를 만든다.** 아래 표와 설계 대조 결과, 4단계 검사 결과 요약을 사용자에게 보여 준다.

   | AC | 판정 | 테스트 위치 | 구현 위치 | 조치 |
   |---|---|---|---|---|
   | AC-01 | 충족 | `<파일>:<줄>` | `<파일>` | 없음 |

8. **빈틈을 처리한다.** 판정이 `부분`이나 `누락`인 AC, 설계와 다른 코드, 실패한 검사, PR 없이 닫힌 Task가 빈틈이다.
   - 코드가 요구사항이나 설계를 따르지 않아 생긴 빈틈은 새 Task 후보로 만든다. 제목, 본문, 라벨, 마일스톤 형식은 [sdd-tasks 스킬](../sdd-tasks/SKILL.md)과 같다.
   - 요구사항이나 설계 자체가 틀려서 생긴 빈틈은 Task로 메우지 않는다. 사용자에게 알리고 `/sdd-spec`이나 `/sdd-design`으로 상위 문서부터 고친다.
   - 후보마다 `S`, `M`, `L`, `XL` 가운데 하나를 Size 제안 값으로 정한다.
   - 후보 목록과 Size 제안 값을 보여 주고 '게이트' 절의 방법으로 확인을 받는다. 그 뒤 5번 명령으로 Task를 만들고, 6~9번 명령으로 `Status`를 `Todo`로, `Size`를 사용자가 확인한 값으로 설정한다.
   - 보고서와 만든 Task 목록을 10번 명령으로 Feature 이슈 댓글에 남긴다. Feature 이슈는 열어 둔다.
   - 새 Task가 모두 병합되면 이 스킬을 다시 실행한다.
9. **빈틈이 없으면 Feature를 닫는다.** '게이트' 절의 방법으로 종료 확인을 받은 뒤 아래 순서로 진행한다.
   - 6~9번 명령으로 Feature 항목의 `SDD 단계`를 `검증`으로 바꾼다.
   - 요약 댓글을 10번 명령으로 남긴다. 요약에는 AC 판정 표, 병합된 PR 목록, 검사 명령과 종료 코드, 요구사항의 범위 밖 절에 남긴 항목을 넣는다.
   - 11번 명령으로 Feature 이슈를 닫는다.

### 명령 모음

명령 안의 `<...>`는 실제 값으로 바꾼다. 5번 명령의 `[--blocked-by <n>]`은 선행 Task가 있을 때만 대괄호를 빼고 붙인다. `--jq`를 지원하지 않는 `gh` 버전이면 `--jq` 부분을 빼고 JSON 출력에서 같은 키를 찾는다.

```bash
# 1. Feature 이슈를 읽는다
gh issue view <FeatureNo> --json number,title,state,body

# 2. 하위 Task 목록을 가져온다
gh api "repos/{owner}/{repo}/issues/<FeatureNo>/sub_issues" --paginate --jq '.[] | {number, title, state, state_reason}'

# 3. Task 하나에 해당하는 병합된 PR을 찾는다
gh pr list --state merged --limit 200 --json number,title,headRefName,body,url --jq '.[] | select((.headRefName | test("/<taskNo>-")) or (.body | test("Closes #<taskNo>([^0-9]|$)"))) | {number, title, url}'

# 4. 최신 main을 받는다
git status --porcelain
git switch main
git pull --ff-only

# 5. 빈틈 Task를 만든다 (사용자 확인 뒤에만)
gh issue create --title "[NNN] <Task 제목>" --body-file <tmp> --type Task --parent <FeatureNo> --milestone "<마일스톤>" --label "area:<영역>" --project "함뜨까" [--blocked-by <n>]

# 6. 프로젝트 번호(number)와 ID(id)를 찾는다
gh project list --owner @me --format json --jq '.projects[] | select(.title == "함뜨까") | {number, id}'

# 7. Status, Size, SDD 단계 필드 ID와 선택지 ID를 찾는다
gh project field-list <projectNo> --owner @me --format json --jq '.fields[] | select(.name == "Status" or .name == "Size" or .name == "SDD 단계") | {name, id, options}'

# 8. 이슈에 해당하는 Project 항목 ID를 찾는다
gh project item-list <projectNo> --owner @me --format json --limit 500 --jq '.items[] | select(.content.number == <issueNo>) | .id'

# 9. 필드 값을 설정한다 (필드마다 한 번씩)
gh project item-edit --id <itemId> --project-id <projectId> --field-id <fieldId> --single-select-option-id <optionId>

# 10. Feature 이슈에 보고서 댓글을 남긴다
gh issue comment <FeatureNo> --body-file <tmp>

# 11. 빈틈이 없을 때만 Feature 이슈를 닫는다
gh issue close <FeatureNo> --reason completed
```

## 산출물

| 산출물 | 위치 | 마친 뒤 상태 |
|---|---|---|
| 검증 보고서 | Feature 이슈 댓글 | AC별 판정, 설계 대조, 검사 결과 |
| 빈틈 Task 이슈(빈틈이 있을 때) | GitHub, Feature의 하위 이슈 | `Status` = `Todo`, `Size` 지정 |
| Feature 이슈(빈틈이 없을 때) | GitHub 이슈 | `SDD 단계` = `검증`, 닫힘 |

## 게이트

이 단계에는 문서 승인 게이트가 없다. 대신 GitHub에 변경을 만들기 전에 사용자 확인을 받는다.

- 빈틈 Task를 만들기 전: `AskUserQuestion`으로 `이 빈틈 목록으로 Task 이슈를 만드시겠습니까?`를 묻고, 선택지는 `이대로 생성`과 `수정 요청`으로 한다.
- Feature를 닫기 전: `AskUserQuestion`으로 `Feature를 검증 완료로 닫으시겠습니까?`를 묻고, 선택지는 `닫기`와 `보류`로 한다.
- 열린 Task가 남아 있거나, 판정이 `충족`이 아닌 AC가 있거나, 검사 하나라도 종료 코드가 0이 아니면 Feature 종료를 묻지 않는다.

## 금지 사항

- 테스트 이름만 보고 `충족`으로 판정하지 않는다. 테스트 내용과 실제 실행 결과를 함께 확인한다.
- 검사의 실제 출력 없이 판정하거나 보고하지 않는다.
- 빈틈을 이 스킬에서 직접 코드로 고치지 않는다. 새 Task를 만들고 `/sdd-implement`로 처리한다.
- 코드에 맞추려고 요구사항이나 설계 문서를 이 스킬에서 고치지 않는다. 상위 문서는 `/sdd-spec`이나 `/sdd-design`에서 승인을 거쳐 고친다.
- 빈틈이 남은 상태에서 `SDD 단계`를 `검증`으로 바꾸거나 Feature 이슈를 닫지 않는다.
- 사용자 확인 없이 이슈를 만들거나 닫지 않는다.

## 참고 문서

- [SDD 진행 가이드](../../../docs/sdd-guide.md): 검증 단계의 목적과 판정 기준의 배경
- [프로젝트 헌법](../../../docs/constitution.md)
- [AGENTS.md](../../../AGENTS.md): 빌드와 테스트 명령
- [ADR-0011 GitHub Issues·Projects로 업무 관리](../../../docs/decisions/0011-github-issues-projects.md)
- 이전 단계: [sdd-implement 스킬](../sdd-implement/SKILL.md), Task 생성 형식: [sdd-tasks 스킬](../sdd-tasks/SKILL.md)
