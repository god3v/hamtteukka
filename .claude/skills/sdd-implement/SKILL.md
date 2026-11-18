---
name: sdd-implement
description: /sdd-implement #42처럼 Task 이슈 번호를 받아 그 이슈 범위만 feat/번호-요약 브랜치에서 구현하고, AC ID로 이름을 붙인 테스트와 typecheck·lint·test 실제 출력을 갖춘 PR을 열 때 사용한다.
---

# Task 구현 (/sdd-implement)

이 스킬은 Task 이슈 하나를 브랜치 하나와 PR 하나로 구현하는 실행 절차를 정한다. 절차를 마치면 Task 범위의 코드와 AC별 테스트가 담긴 PR이 열리고, Project에서 Task 항목의 `Status`가 `In Progress`로 바뀐다.

PR이 병합되면 PR 본문의 `Closes #<번호>`가 Task 이슈를 닫고, Project 자동화가 `Status`를 `Done`으로 옮긴다. Task를 PR 하나로 끝내는 이유와 상위 문서를 먼저 고치는 규칙의 배경은 [SDD 진행 가이드](../../../docs/sdd-guide.md)가 설명한다.

## 입력

| 입력 | 위치 | 확인할 내용 |
|---|---|---|
| Task 이슈 번호 | 스킬 인수(예: `/sdd-implement #42`) | `#42`와 `42`를 모두 받고, 앞의 `#`을 떼고 숫자만 쓴다. 인수가 없으면 사용자에게 묻는다 |
| Task 이슈 본문 | GitHub | 상위 Feature, 관련 문서, 다루는 AC, 작업 범위, 범위 밖, 선행 Task |
| 요구사항과 설계 | Task 본문에 적힌 `docs/specs/NNN-<kebab>/` 경로 | `status: approved`, 해당 AC와 설계 요소 |
| 헌법과 작업 규칙 | [constitution.md](../../../docs/constitution.md), [AGENTS.md](../../../AGENTS.md) | 지킬 원칙, 빌드와 테스트 명령 |
| PR 템플릿 | [pull_request_template.md](../../../.github/pull_request_template.md) | PR 본문 절 구성 |

### 명령 실행 환경

- 이 스킬의 명령은 Bash 문법으로 적었다. Windows PowerShell 5.1은 네이티브 프로그램에 넘기는 인수 안의 큰따옴표를 지워 `--jq` 식이 깨지므로, Bash 도구에서 실행한다.
- `gh`가 PATH에 없으면 Windows에서는 `"/c/Program Files/GitHub CLI/gh.exe"`(Bash)나 `& "C:\Program Files\GitHub CLI\gh.exe"`(PowerShell)로 실행한다.
- `gh project` 명령은 토큰에 `project` 권한(scope)이 있어야 동작한다. 없으면 사용자에게 `gh auth refresh -s project` 실행을 요청한다.
- PR 본문은 Write 도구로 저장소 밖 임시 파일(세션 scratchpad 등)에 UTF-8로 쓴 뒤 `<tmp>` 자리에 그 경로를 넣는다.

## 절차

1. **Task 이슈를 읽는다.** '명령 모음'의 1번 명령으로 이슈를 읽는다.
   - `state`가 `OPEN`이 아니면 멈추고 사용자에게 알린다.
   - 본문의 절 제목(상위 Feature, 관련 문서, 다루는 수용 기준, 작업 범위, 범위 밖, 선행 Task)으로 각 값을 읽는다. 절 이름과 순서는 [task.yml](../../../.github/ISSUE_TEMPLATE/task.yml)과 같다.
   - 선행 Task 절이 `없음`이면 다음 단계로 넘어간다. 번호가 있으면 선행 Task마다 2번 명령으로 상태를 확인한다. `CLOSED`가 아닌 선행 Task가 있으면 멈추고, 어떤 Task를 먼저 끝내야 하는지 사용자에게 알린다.
2. **관련 문서를 읽는다.** 요구사항에서 해당 AC를, 설계에서 Task가 쓰는 다이어그램과 RLS 정책 행을 읽는다. 두 문서의 `status`가 `approved`가 아니면 멈춘다. 헌법과 AGENTS.md도 함께 읽는다.
3. **브랜치를 만든다.** 3번 명령을 차례로 실행한다.
   - `git status --porcelain` 출력이 비어 있지 않으면 진행하지 않고, 남은 변경을 어떻게 처리할지 사용자에게 묻는다.
   - 브랜치 이름은 `feat/<이슈번호>-<slug>`다. slug는 이슈 제목을 짧은 영어 kebab-case로 줄인 값이다.
   - 같은 이름의 브랜치가 이미 있으면 새로 만들지 않고 `git switch feat/<이슈번호>-<slug>`로 이어서 작업한다.
4. **`Status`를 `In Progress`로 바꾼다.** 4번 명령 묶음으로 Task 항목의 `Status`를 바꾼다.
5. **테스트를 먼저 쓴다.**
   - Task가 다루는 AC마다 테스트를 하나 이상 쓴다. 테스트 이름은 `NNN/AC-xx`로 시작한다. 예: `test("003/AC-04 리셋하기 전에 확인을 받는다", ...)`.
   - 테스트가 AC의 Given, When, Then을 각각 준비, 실행, 확인 단계로 담게 쓴다.
   - RLS 정책을 추가하거나 바꾸는 Task는 허용되는 경우와 거부되는 경우를 모두 테스트한다.
   - 구현 전에 테스트를 실행해 실패하는지 확인한다.
6. **이슈 범위만 구현한다.**
   - Task 본문의 작업 범위에 있는 변경만 한다. 범위 밖에서 고칠 점을 발견했을 때, 문서 문구나 설정 같은 작은 수정이면 이 PR에 함께 넣고 PR 본문에 따로 적는다([ADR-0012](../../../docs/decisions/0012-issue-for-planned-work-only.md)). 기능 변경이나 큰 리팩터링이면 코드에 넣지 않고 새 이슈로 만들자고 사용자에게 제안한다.
   - `supabase-js`는 `packages/shared` 안에서만 import한다.
   - shared 함수는 zod로 정의한 자체 DTO와 자체 오류 타입을 반환한다. Supabase 타입이나 `PostgrestError`를 shared 밖으로 노출하지 않는다.
   - `apps/web`의 Server Action은 shared 함수를 호출하고 결과를 전달하는 얇은 래퍼로만 쓴다.
   - 마이그레이션은 `supabase/migrations`에 추가하고, RLS 정책은 `design/erd.md` 정책 표와 같게 만든다. `commerce` 스키마는 만들지 않는다.
   - 이메일을 회원 식별 키로 쓰지 않는다.
   - 출시 단계가 오지 않은 `apps/api`나 `apps/mobile`을 만들지 않는다.
7. **상위 문서와 어긋나면 멈춘다.** 아래 가운데 하나라도 해당하면 코드를 더 쓰지 않고, 어긋난 코드도 커밋하지 않는다.
   - 설계에 없는 테이블, 열, RLS 정책, 화면, shared 공개 함수가 필요하다.
   - RLS 정책이나 데이터 흐름을 설계와 다르게 만들어야 AC를 구현할 수 있다.
   - AC를 그대로 구현하면 다른 AC나 헌법과 충돌한다.
   - 이 경우 무엇이 어긋났고 왜 필요한지 사용자에게 설명한다. 설계 문제이면 `/sdd-design`, 요구사항 문제이면 `/sdd-spec`으로 돌아가 상위 문서를 먼저 고친다.
   - 상위 문서가 다시 승인되면 `/sdd-tasks`로 영향받는 Task를 갱신한 뒤 이 스킬을 다시 실행한다.
   - 작업이 Task 범위보다 커져 200줄을 크게 넘을 것으로 보이면, 범위를 줄이고 남은 작업은 새 Task로 나누자고 제안한다.
8. **검사를 실행한다.**
   - 저장소 루트에서 AGENTS.md에 적힌 typecheck, lint, test 명령을 차례로 실행한다. 예: `pnpm typecheck`, `pnpm lint`, `pnpm test`.
   - 출력을 `tail`, `head`, `grep`으로 파이프하지 않는다. 파이프를 거치면 실패 종료 코드가 가려질 수 있다.
   - 세 명령이 모두 종료 코드 0으로 끝날 때까지 고치고 다시 실행한다.
   - 각 명령의 실제 출력과 종료 코드를 그대로 보관한다. 출력 없이 통과했다고 보고하지 않는다.
9. **커밋하고 푸시한다.**
   - Task 범위의 파일과 6단계에서 함께 넣기로 한 작은 수정만 스테이징한다.
   - 커밋 메시지는 Conventional Commits 접두어와 한국어 요약으로 쓰고 끝에 이슈 번호를 붙인다. 예: `feat: 단수 카운터 리셋 확인 추가 (#12)`.
   - 5번 명령으로 브랜치를 푸시한다.
10. **PR을 연다.**
    - `.github/pull_request_template.md`를 임시 파일로 복사하고 템플릿의 8개 절을 모두 채운다. 해당하는 내용이 없는 절에는 "없음"이라고 적고 절을 지우지 않는다.
    - "해결하려는 문제가 무엇인가요?" 절의 첫 줄에 `Closes #<이슈번호>`를 적고, 상위 Feature 번호와 이 PR이 다루는 AC ID를 함께 적는다.
    - "왜 해야 하나요?" 절에 근거가 되는 요구사항(FR)과 설계 문서 경로를 적는다.
    - "어떻게 해결했나요?" 절에는 6단계에서 함께 넣은 작은 수정을 따로 적는다. 절 끝에는 `<details><summary>검증 출력</summary>` 블록을 추가하고, 8단계에서 보관한 실제 출력과 종료 코드를 붙인다.
    - "리뷰 포인트" 절에는 위험도가 높은 것부터 파일이나 영역을 🔴 높음, 🟡 보통, 🟢 낮음으로 나누어 적는다.
    - PR 본문은 사람이 동료에게 설명하듯 읽기 쉽게 쓴다.
      - 합쇼체(`~했습니다`)의 짧은 문장으로 쓰고, 한 항목에는 한 가지 내용만 담는다.
      - 굵은 글씨 라벨을 항목마다 붙이지 않는다. 강조는 꼭 필요한 곳에만 쓴다.
      - 전문 용어나 도구 이름은 처음 나올 때 무엇인지 짧게 풀어 쓴다. 예: "린트 도구(typescript-eslint)".
      - 이유를 설명할 때는 "~하기 때문입니다"처럼 문장으로 잇고, 괄호 안에 긴 설명을 넣지 않는다.
      - 저장소 문서 링크는 PR 화면에서 열리도록 `https://github.com/god3v/hamtteukka/blob/main/...` 절대 주소로 쓴다.
      - 검사 출력에 로컬 경로가 있으면 `<repo>`로 바꾼다.
    - 6번 명령으로 PR을 만든다. PR 제목은 `<type>: <한국어 요약>`처럼 Conventional Commits 접두어와 한국어 요약으로 쓴다.
    - 7번 명령으로 CodeRabbit 리뷰를 요청한다. 별이 10개 미만인 공개 저장소에서는 CodeRabbit이 자동으로 리뷰하지 않는다.
11. **보고하고 리뷰를 기다린다.**
    - PR URL, 각 검사 명령의 실제 출력 마지막 부분과 종료 코드, 리뷰 포인트를 사용자에게 보고한다.
    - 사용자나 CodeRabbit의 리뷰 의견을 받으면 근거를 확인한 뒤 같은 브랜치에서 고치고 8단계부터 다시 진행한다.
    - 반영하지 않는 CodeRabbit 지적에는 이유를 답글로 남긴다.

### 명령 모음

명령 안의 `<...>`는 실제 값으로 바꾼다. `--jq`를 지원하지 않는 `gh` 버전이면 `--jq` 부분을 빼고 JSON 출력에서 같은 키를 찾는다.

```bash
# 1. Task 이슈를 읽는다
gh issue view <n> --json number,title,body,state,labels,milestone

# 2. 선행 Task의 상태를 확인한다
gh issue view <m> --json state --jq .state

# 3. main에서 브랜치를 만든다
git status --porcelain
git switch main
git pull --ff-only
git switch -c feat/<n>-<slug>

# 4. Project의 Status를 In Progress로 바꾼다
gh project list --owner @me --format json --jq '.projects[] | select(.title == "함뜨까") | {number, id}'
gh project field-list <projectNo> --owner @me --format json --jq '.fields[] | select(.name == "Status") | {id, options}'
gh project item-list <projectNo> --owner @me --format json --limit 500 --jq '.items[] | select(.content.number == <n>) | .id'
gh project item-edit --id <itemId> --project-id <projectId> --field-id <fieldId> --single-select-option-id <optionId>

# 5. 브랜치를 푸시한다
git push -u origin feat/<n>-<slug>

# 6. PR을 만든다
gh pr create --base main --head feat/<n>-<slug> --title "<type>: <한국어 요약>" --body-file <tmp>

# 7. CodeRabbit 리뷰를 요청한다
gh pr comment <prNo> --body "@coderabbitai review"
```

## 산출물

| 산출물 | 위치 | 마친 뒤 상태 |
|---|---|---|
| 작업 브랜치 | `feat/<이슈번호>-<slug>` | 원격 저장소에 푸시됨 |
| 코드와 마이그레이션 | `apps/web`, `packages/shared`, `supabase/` 가운데 Task 범위 | typecheck, lint, test 통과 |
| AC별 테스트 | 테스트 이름이 `NNN/AC-xx`로 시작 | 모두 통과 |
| PR | GitHub, 본문에 `Closes #<이슈번호>` | 사용자 리뷰 대기 |
| Task 항목 | GitHub Project | `Status` = `In Progress` |

## 게이트

PR은 사용자가 리뷰하고 병합한다. 이 스킬은 PR을 열고 보고한 뒤 멈춘다.

- PR을 열기 전에 8단계의 세 검사가 모두 종료 코드 0이어야 한다.
- 리뷰 요청은 PR URL, 검사 출력, 리뷰 포인트를 보고하는 방식으로 한다. 병합 여부는 사용자가 GitHub에서 정한다.
- 7단계에서 멈춘 경우 `AskUserQuestion`으로 다음 진행을 묻는다. 질문 문구는 `상위 문서를 먼저 고치시겠습니까?`로 하고, 선택지는 `상위 문서부터 고치기`와 `Task 범위 조정` 두 개로 한다.
- `상위 문서부터 고치기`를 고르면 설계 문제는 `/sdd-design`, 요구사항 문제는 `/sdd-spec`을 안내한다. `Task 범위 조정`을 고르면 설계 안에서 이번 Task 범위를 줄이고, 남은 작업을 새 Task로 만들자고 제안한다.

## 금지 사항

- Task 범위 밖의 기능 변경, 큰 리팩터링, 다른 AC 구현을 같은 PR에 넣지 않는다. 함께 넣을 수 있는 작은 수정의 기준은 ADR-0012를 따른다.
- 설계와 다른 테이블, 열, RLS 정책, 화면을 코드에 먼저 만들지 않는다.
- 검사의 실제 출력 없이 완료를 보고하지 않는다.
- 테스트를 건너뛰게 바꾸거나 실패하는 테스트를 지워서 검사를 통과시키지 않는다.
- `--no-verify`로 커밋 훅을 건너뛰지 않는다.
- `main`에 직접 커밋하거나 PR을 직접 병합하지 않는다.
- `Status`를 `Done`으로 직접 바꾸지 않는다. 병합 뒤 Project 자동화가 바꾼다.
- 저장소 안에 PR 본문 임시 파일을 만들지 않는다.

## 참고 문서

- [SDD 진행 가이드](../../../docs/sdd-guide.md): 구현 단계 규칙과 상위 문서를 먼저 고치는 이유
- [프로젝트 헌법](../../../docs/constitution.md)
- [AGENTS.md](../../../AGENTS.md): 저장소 구조, 빌드와 테스트 명령, 브랜치와 PR 규칙
- [PR 템플릿](../../../.github/pull_request_template.md)
- [ADR-0003 Supabase 접근을 packages/shared로 제한](../../../docs/decisions/0003-data-access-boundary.md)
- [ADR-0004 RLS를 1차 권한 검사로 사용](../../../docs/decisions/0004-rls-authorization.md)
- 이전 단계: [sdd-tasks 스킬](../sdd-tasks/SKILL.md), 다음 단계: [sdd-verify 스킬](../sdd-verify/SKILL.md)
