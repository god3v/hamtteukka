# 함뜨까 작업 규칙

이 문서는 함뜨까 저장소에서 작업하는 AI 세션이 가장 먼저 읽는 규칙과 문서 지도다. 세부 내용은 연결된 문서가 관리하므로, 여기에는 작업을 시작할 때 놓치면 안 되는 규칙과 읽을 순서만 적는다.

## 먼저 읽을 문서

| 순서 | 문서 | 읽는 이유 |
|---|---|---|
| 1 | [docs/constitution.md](docs/constitution.md) | 모든 작업이 지켜야 하는 원칙과 확인 방법 |
| 2 | [docs/sdd-guide.md](docs/sdd-guide.md) | 기능 개발 절차와 SDD 적용 기준 |
| 3 | [docs/decisions/README.md](docs/decisions/README.md) | 확정된 결정과 아직 정하지 않은 항목 |
| 4 | [docs/product/roadmap.md](docs/product/roadmap.md) | 지금 진행 중인 출시 단계와 범위 |
| 5 | 작업 대상 `docs/specs/NNN-*/` | 요구사항과 설계 다이어그램 |

## 작업 흐름

새 테이블이나 새 화면을 추가하거나 권한 규칙을 바꾸는 작업은 SDD 절차를 따른다. 버그 수정, 문구 수정, 리팩터링은 이슈와 PR로 바로 처리한다.

| 단계 | 스킬 | 산출물 |
|---|---|---|
| 요구사항 | `/sdd-spec` | `docs/specs/NNN-*/requirements.md` |
| 설계 | `/sdd-design` | `docs/specs/NNN-*/design/*.md` (Mermaid 다이어그램) |
| 작업 분해 | `/sdd-tasks` | GitHub Task 이슈 (Feature 이슈의 하위 이슈) |
| 구현 | `/sdd-implement #번호` | 브랜치, 코드, 테스트, PR |
| 검증 | `/sdd-verify` | 수용 기준 대조 결과, 누락 작업 이슈 |

각 단계의 게이트와 이유는 [docs/sdd-guide.md](docs/sdd-guide.md)에 있다. `spec.md`, `plan.md`, `tasks.md`는 만들지 않는다.

## 반드시 지킬 규칙

- `supabase-js`는 `packages/shared` 안에서만 import한다. 앱 코드는 shared 함수만 호출한다 ([ADR-0003](docs/decisions/0003-data-access-boundary.md)).
- RLS 정책을 추가하거나 바꾸면 해당 기능의 `design/erd.md` 정책 표를 함께 고친다 ([ADR-0004](docs/decisions/0004-rls-authorization.md)).
- 이메일을 회원 식별 키로 쓰지 않는다 ([ADR-0005](docs/decisions/0005-auth-supabase-social-login.md)).
- 구매 대금을 운영자 계좌로 받아 작가에게 보내는 흐름을 만들지 않는다 ([ADR-0009](docs/decisions/0009-payout-via-pg.md)).
- Task 이슈 하나는 PR 하나로 끝낸다 ([ADR-0011](docs/decisions/0011-github-issues-projects.md)).
- 설계를 바꿔야 하면 코드나 이슈를 먼저 고치지 않는다. 요구사항이나 설계 문서를 먼저 고친 뒤 아래 단계를 다시 만든다.
- 완료를 보고할 때는 typecheck, lint, test의 실제 출력을 근거로 삼는다.

## 저장소 구조

```
apps/web/          Next.js 웹 앱 (@hamtteukka/web)
packages/shared/   데이터 접근 함수, zod DTO, 공통 로직 (@hamtteukka/shared)
supabase/          마이그레이션과 로컬 설정 (R0 #3에서 생성)
docs/              제품, 결정, 조사, 명세 문서
.claude/skills/    SDD 스킬
```

`apps/api`(Spring Boot)는 R4에서, `apps/mobile`(Expo)은 A1에서 추가한다. 그 전에는 만들지 않는다.

`packages/shared`의 코드는 `src/<도메인>/` 폴더로 나누고, 다른 패키지가 쓸 수 있는 이름은 모두 `src/index.ts`에 모은다. 웹 앱은 `@hamtteukka/shared`를 TypeScript 소스 그대로 가져가며, `next.config.ts`의 `transpilePackages`가 이를 변환한다.

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

특정 패키지만 실행하려면 `pnpm --filter @hamtteukka/shared test`처럼 `--filter`를 붙인다.

### 도구와 버전

| 도구 | 버전 | 비고 |
|---|---|---|
| Node.js | 24 이상 | 루트 `package.json`의 `engines` |
| pnpm | 12.21.0 | 루트 `package.json`의 `packageManager` |
| Next.js / React | 16.4.6 / 19.3.1 | |
| TypeScript | 6.0.3 | typescript-eslint 8.73.0이 6.1 미만만 지원한다 |
| ESLint | 9.39.5 | eslint-config-next가 쓰는 react, import, jsx-a11y 플러그인이 ESLint 10을 지원하지 않는다 |
| zod / Vitest / Turborepo | 4.6.7 / 5.1.0 / 2.11.11 | |

- 의존성은 범위 지정자 없이 정확한 버전으로 적는다(`.npmrc`의 `save-exact=true`, 헌법 P-14).
- pnpm은 배포된 지 얼마 되지 않은 버전의 설치를 거부한다. 이 경우 `minimumReleaseAgeExclude` 예외를 추가하지 않고, 기간이 지난 이전 버전을 고른다.

## GitHub

- 저장소: `god3v/hamtteukka`, 기본 브랜치 `main`
- Project 보드: `함뜨까`, 번호 5 (`gh project ... 5 --owner @me`). 필드: Status, SDD 단계, Size, Iteration
- 마일스톤: R0 기반, R1 MVP, R1+ 도구 보강, R2 무료 도안 배포, R3 커뮤니티, R4 유료 판매, A1 앱
- 브랜치 이름: `feat/<이슈번호>-<요약>`, `fix/<이슈번호>-<요약>`, `docs/<이슈번호>-<요약>`
- Windows에서 `gh`가 PATH에 없으면 `C:\Program Files\GitHub CLI\gh.exe`를 쓴다.

## 문서 작성 규칙

- 문서는 한국어 평서체(`-다`)로 쓰고, 한 문서 안에서 어체를 섞지 않는다.
- `docs/` 아래 문서는 frontmatter(`doc_type`, `status`, `updated`)와 두 문장 이상의 리드를 갖춘다.
- 설계는 Mermaid 다이어그램으로 표현한다. 한글 라벨은 큰따옴표로 감싸고, 베타 다이어그램 유형은 쓰지 않는다.
- `docs/research/`는 조사 시점의 기록이다. 새 사실은 새 조사 문서로 남기고 기존 기록을 고쳐 쓰지 않는다.
- 문서를 고친 뒤에는 `korean-refine` 스킬의 검사기를 `--style plain` 옵션으로 실행해 문장을 확인한다.
