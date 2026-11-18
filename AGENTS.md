# 함뜨까 에이전트 작업 규칙

이 문서는 함뜨까 저장소에서 일하는 사람과 코딩 에이전트(Claude Code, Codex, Cursor, CodeRabbit 등)가 함께 따르는 작업 규칙과 문서 지도다. 세부 내용은 연결된 문서가 관리하므로, 여기에는 작업을 시작할 때 놓치면 안 되는 명령, 규칙, 읽을 순서만 적는다.

함뜨까는 뜨개 프로젝트 기록 도구와 도안 배포를 한 계정으로 잇는 웹 서비스다. Next.js 웹 앱과 Supabase(Postgres, Auth, Storage, RLS)로 만들며, 지금은 R0 기반 단계를 진행하고 있다.

## 먼저 읽을 문서

| 순서 | 문서 | 읽는 이유 |
|---|---|---|
| 1 | [docs/constitution.md](docs/constitution.md) | 모든 작업이 지켜야 하는 원칙과 확인 방법 |
| 2 | [docs/sdd-guide.md](docs/sdd-guide.md) | 기능 개발 절차와 SDD 적용 기준 |
| 3 | [docs/decisions/README.md](docs/decisions/README.md) | 확정된 결정과 아직 정하지 않은 항목 |
| 4 | [docs/product/roadmap.md](docs/product/roadmap.md) | 지금 진행 중인 출시 단계와 범위 |
| 5 | 작업 대상 `docs/specs/NNN-*/` | 요구사항과 설계 다이어그램 |

## 명령

모든 명령은 저장소 루트에서 실행한다. Turborepo가 각 패키지의 같은 이름 스크립트를 실행한다.

| 명령 | 하는 일 |
|---|---|
| `pnpm install` | 의존성 설치 (`pnpm-lock.yaml` 기준) |
| `pnpm dev` | 웹 개발 서버 (http://localhost:3000) |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm typecheck` | 타입 검사 (`apps/web`은 `next typegen` 뒤 `tsc --noEmit`) |
| `pnpm lint` | ESLint 검사 |
| `pnpm test` | Vitest 테스트 |
| `node scripts/check-docs.mjs` | `docs/` 문서의 frontmatter, 제목, 리드, Mermaid 유형 검사 |

특정 패키지만 실행하려면 `pnpm --filter @hamtteukka/shared test`처럼 `--filter`를 붙인다.

### 도구와 버전

| 도구 | 버전 | 비고 |
|---|---|---|
| Node.js | 24.x | `package.json`의 `engines`. Vercel 배포도 같은 버전을 쓴다 |
| pnpm | 12.21.0 | 루트 `package.json`의 `packageManager` |
| Next.js / React | 16.4.6 / 19.3.1 | |
| TypeScript | 6.0.3 | typescript-eslint 8.73.0이 6.1 미만만 지원한다 |
| ESLint | 9.39.5 | eslint-config-next가 쓰는 react, import, jsx-a11y 플러그인이 ESLint 10을 지원하지 않는다 |
| zod / Vitest / Turborepo | 4.6.7 / 5.1.0 / 2.11.11 | |

- 의존성은 범위 지정자 없이 정확한 버전으로 적는다(`.npmrc`의 `save-exact=true`, 헌법 P-14).
- pnpm은 배포된 지 얼마 되지 않은 버전의 설치를 거부한다. 이 경우 `minimumReleaseAgeExclude` 예외를 추가하지 않고, 기간이 지난 이전 버전을 고른다.
- `pnpm-lock.yaml`은 직접 고치지 않고 `pnpm install`이나 `pnpm add`로만 바꾼다.

## 저장소 구조

```
apps/web/          Next.js 웹 앱 (@hamtteukka/web)
packages/shared/   데이터 접근 함수, zod DTO, 공통 로직 (@hamtteukka/shared)
supabase/          마이그레이션과 로컬 설정 (R0 #3에서 생성)
docs/              제품, 결정, 조사, 명세 문서
scripts/           저장소 검사 스크립트
.claude/           Claude Code 스킬(SDD 절차)과 훅
```

`apps/api`(Spring Boot)는 R4에서, `apps/mobile`(Expo)은 A1에서 추가한다. 그 전에는 만들지 않는다.

`packages/shared`의 코드는 `src/<도메인>/` 폴더로 나누고, 다른 패키지가 쓸 수 있는 이름은 모두 `src/index.ts`에 모은다. 웹 앱은 `@hamtteukka/shared`를 TypeScript 소스 그대로 가져가며, `next.config.ts`의 `transpilePackages`가 이를 변환한다.

## 작업 흐름

새 테이블이나 새 화면을 추가하거나 권한 규칙을 바꾸는 작업은 SDD 절차를 따른다. 버그 수정, 문구 수정, 리팩터링은 SDD 없이 PR로 바로 처리하며, 이슈가 필요한지는 아래 "브랜치, 커밋, PR" 절과 [ADR-0012](docs/decisions/0012-issue-for-planned-work-only.md)를 따른다.

| 단계 | 산출물 | 절차 문서 |
|---|---|---|
| 요구사항 | `docs/specs/NNN-*/requirements.md` | [sdd-spec](.claude/skills/sdd-spec/SKILL.md) |
| 설계 | `docs/specs/NNN-*/design/*.md` (Mermaid 다이어그램) | [sdd-design](.claude/skills/sdd-design/SKILL.md) |
| 작업 분해 | GitHub Task 이슈 (Feature 이슈의 하위 이슈) | [sdd-tasks](.claude/skills/sdd-tasks/SKILL.md) |
| 구현 | 브랜치, 코드, 테스트, PR | [sdd-implement](.claude/skills/sdd-implement/SKILL.md) |
| 검증 | 수용 기준 대조 결과, 누락 작업 이슈 | [sdd-verify](.claude/skills/sdd-verify/SKILL.md) |

각 단계의 게이트와 이유는 [docs/sdd-guide.md](docs/sdd-guide.md)에 있다. 절차 문서는 Claude Code 스킬 형식이지만, 다른 에이전트도 같은 문서를 절차로 읽고 따른다. `spec.md`, `plan.md`, `tasks.md`는 만들지 않는다.

## 반드시 지킬 규칙

- `@supabase/supabase-js`와 `@supabase/ssr`은 `packages/shared` 안에서만 import한다. 앱 코드는 shared 함수만 호출한다 ([ADR-0003](docs/decisions/0003-data-access-boundary.md)).
- RLS 정책을 추가하거나 바꾸면 해당 기능의 `design/erd.md` 정책 표를 함께 고친다 ([ADR-0004](docs/decisions/0004-rls-authorization.md)).
- 이메일을 회원 식별 키로 쓰지 않는다 ([ADR-0005](docs/decisions/0005-auth-supabase-social-login.md)).
- 구매 대금을 운영자 계좌로 받아 작가에게 보내는 흐름을 만들지 않는다 ([ADR-0009](docs/decisions/0009-payout-via-pg.md)).
- 계획된 작업(Task 이슈)은 PR 하나로 끝낸다 ([ADR-0011](docs/decisions/0011-github-issues-projects.md)). 문서 문구나 설정 같은 작은 수정은 이슈 없이 열려 있는 관련 PR에 함께 넣거나, 이슈 없는 PR로 처리한다 ([ADR-0012](docs/decisions/0012-issue-for-planned-work-only.md)). 어떤 경우든 main에 직접 커밋하지 않는다.
- 설계를 바꿔야 하면 코드나 이슈를 먼저 고치지 않는다. 요구사항이나 설계 문서를 먼저 고친 뒤 아래 단계를 다시 만든다.
- 비밀 값(API 키, OAuth client secret, service-role 키, `.env` 파일)은 만들거나 커밋하지 않는다. 필요한 키 이름은 `.env.example`에 적는다 (헌법 P-10).

## 검증과 완료 보고

- 완료를 보고할 때는 `pnpm typecheck`, `pnpm lint`, `pnpm test`의 실제 출력과 종료 코드를 근거로 삼는다. 실행하지 않은 검사를 통과했다고 보고하지 않는다.
- 검사 출력을 `head`, `tail`, `grep`으로 파이프하지 않는다. 파이프를 거치면 실패 종료 코드가 가려진다. 출력이 길면 파일로 저장하고 종료 코드를 함께 확인한다 (헌법 P-09).
- 수용 기준을 확인하는 테스트는 이름 앞에 기능 번호와 AC ID를 붙인다. 예: `test("003/AC-04 리셋하기 전에 확인을 받는다", ...)`
- 검사가 실패한 상태로 작업을 마쳐야 하면, 실패한 출력을 그대로 보고하고 남은 일을 적는다.

## 브랜치, 커밋, PR

- 브랜치 이름: 이슈가 있으면 `feat/<이슈번호>-<요약>`, `fix/<이슈번호>-<요약>`, `docs/<이슈번호>-<요약>`을 쓰고, 이슈 없는 PR은 `docs/<요약>`, `chore/<요약>`처럼 이슈 번호를 빼고 쓴다.
- `main`에 직접 커밋하거나 푸시하지 않는다. `--no-verify`로 git 훅을 건너뛰지 않는다.
- 커밋 메시지는 Conventional Commits 접두어와 한국어 요약으로 쓴다. 예: `feat: 단수 카운터 리셋 확인 추가 (#12)`
- PR 본문은 [PR 템플릿](.github/pull_request_template.md)의 8개 절을 모두 채운다. 이슈가 있으면 첫 줄에 `Closes #<이슈 번호>`를 적고, 이슈 없이 함께 넣은 작은 수정은 "어떻게 해결했나요?" 절에 따로 적는다.
- PR 본문은 동료에게 설명하듯 합쇼체의 짧은 문장으로 쓴다. 자세한 작성 기준은 [sdd-implement](.claude/skills/sdd-implement/SKILL.md)의 10단계에 있다.
- PR을 연 뒤 `@coderabbitai review` 코멘트로 CodeRabbit 리뷰를 요청한다. 별이 10개 미만인 공개 저장소에서는 CodeRabbit이 자동으로 리뷰하지 않는다.
- CodeRabbit의 지적은 근거를 확인한 뒤 반영한다. 반영하지 않는 지적에는 이유를 답글로 남긴다.

## 문서 작성 규칙

- 문서는 한국어 평서체(`-다`)로 쓰고, 한 문서 안에서 어체를 섞지 않는다.
- `docs/` 아래 문서는 frontmatter(`doc_type`, `status`, `updated`)와 두 문장 이상의 리드를 갖춘다.
- 설계는 Mermaid 다이어그램으로 표현한다. 한글 라벨은 큰따옴표로 감싸고, 베타 다이어그램 유형은 쓰지 않는다. 쓸 수 있는 유형은 flowchart, sequenceDiagram, classDiagram, erDiagram, stateDiagram-v2, timeline, gantt다.
- `docs/research/`는 조사 시점의 기록이다. 새 사실은 새 조사 문서로 남기고 기존 기록을 고쳐 쓰지 않는다.
- 문서를 고친 뒤에는 `node scripts/check-docs.mjs`로 구조를 검사한다.

## GitHub

- 저장소: `god3v/hamtteukka`, 기본 브랜치 `main`
- Project 보드: `함뜨까`, 번호 5 (`gh project ... 5 --owner @me`). 필드: Status, SDD 단계, Size, Iteration
- 마일스톤: R0 기반, R1 MVP, R1+ 도구 보강, R2 무료 도안 배포, R3 커뮤니티, R4 유료 판매, A1 앱
- Windows에서 `gh`가 PATH에 없으면 `C:\Program Files\GitHub CLI\gh.exe`를 쓴다.
