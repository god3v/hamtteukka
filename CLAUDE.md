# 함뜨까 Claude Code 지침

이 문서는 Claude Code가 함뜨까 저장소에서 가장 먼저 읽는 진입점이다. 모든 에이전트가 함께 따르는 규칙은 아래에서 가져오는 AGENTS.md에 있고, 이 문서에는 Claude Code에만 해당하는 스킬, 훅, 문장 검사 규칙을 적는다.

@AGENTS.md

## SDD 스킬

AGENTS.md의 작업 흐름 표에 있는 단계는 아래 스킬로 실행한다.

| 단계 | 스킬 |
|---|---|
| 요구사항 | `/sdd-spec` |
| 설계 | `/sdd-design` |
| 작업 분해 | `/sdd-tasks` |
| 구현 | `/sdd-implement #번호` |
| 검증 | `/sdd-verify` |

## 하네스 훅

`.claude/settings.json`이 아래 훅을 건다. 훅이 작업을 막거나 지적하면 우회하지 말고, 메시지가 가리키는 규칙에 맞게 작업을 고친다. 훅의 판단이 틀렸다고 보이면 사용자에게 알린다.

| 시점 | 스크립트 | 하는 일 |
|---|---|---|
| 도구 실행 전 | [pre-tool-guard.mjs](.claude/hooks/pre-tool-guard.mjs) | `docs/research/` 기존 문서 수정, `.env` 파일 작성, `pnpm-lock.yaml` 직접 수정, 검사 출력 파이프, `--no-verify`, `main` 직접 푸시를 막는다 |
| 파일 수정 후 | [post-edit-check.mjs](.claude/hooks/post-edit-check.mjs) | 고친 `docs/` 문서의 구조를 검사하고, `apps/`에서 Supabase 클라이언트를 import하면 알린다 |
| 응답을 마칠 때 | [stop-verify.mjs](.claude/hooks/stop-verify.mjs) | 코드가 바뀌었으면 typecheck, lint, test를 실행하고, 문서가 바뀌었으면 구조 검사와 korean-refine 검사를 실행한다. 실패하면 한 번 더 작업하게 한다 |

## 문장 검사

문서를 고친 뒤에는 `korean-refine` 스킬의 검사기를 `--style plain` 옵션으로 실행해 문장을 확인한다. 응답을 마칠 때 훅이 바뀐 문서에 이 검사기를 실행하지만, 검사기는 사용자 스킬 폴더에 있으므로 없는 환경에서는 건너뛴다.
