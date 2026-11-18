<div align="center">

# 🧶 함뜨까

**뜨개 기록부터 도안 공유까지, 한 계정으로 이어지는 뜨개 웹 서비스**

![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?logo=turborepo&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)

[출시 로드맵](docs/product/roadmap.md) · [문서](docs/README.md) · [이슈](https://github.com/god3v/hamtteukka/issues) · [마일스톤](https://github.com/god3v/hamtteukka/milestones)

</div>

## 소개

함뜨까는 설치 없이 브라우저에서 쓰는 뜨개 도구다. 진행 중인 작품의 단수, 게이지, 도안 파일을 한 계정에 기록하고, 휴대폰과 PC에서 같은 기록을 이어서 본다. 같은 계정 위에 작가의 도안 배포와 커뮤니티를 차례로 붙여, 도안을 받는 일과 뜨개 과정을 기록하는 일을 한 서비스에서 하게 한다.

## 주요 기능

| 기능 | 내용 | 출시 단계 |
|---|---|---|
| 프로젝트 기록 | 작품별 진행 기록, 위시리스트와 작업 대기열 | R1 |
| 단수 카운터 | 기본·퀵·다중·반복 카운터, 로그인 전에 쓰는 퀵 카운터 | R1 |
| 게이지 기록 | 작품별 게이지 저장 | R1 |
| 내 도안 파일 | 가지고 있는 도안 파일을 프로젝트에 첨부 | R1 |
| 무료 도안 배포 | 작가 프로필, 도안 등록과 심사, 내 도안함, 수정본 알림 | R2 |
| 커뮤니티 | 게시판, 후기와 Q&A, 완성작 갤러리, 신고와 차단 | R3 |
| 유료 도안 판매 | 결제와 환불, PG 지급대행 정산 | R4 |
| 모바일 앱 | Expo 앱, 푸시 알림, 카운터 위젯 | A1 |

지금은 **R0 기반** 단계를 진행하고 있다. 단계별 범위와 진입 조건은 [출시 로드맵](docs/product/roadmap.md)에 있다.

## 기술 스택

| 영역 | 기술 |
|---|---|
| 웹 | Next.js 16 (App Router), React 19, TypeScript |
| 데이터·인증·파일 | Supabase (Postgres, Auth, Storage, RLS) |
| 공통 로직 | `packages/shared`: zod DTO와 데이터 접근 함수 |
| 배포 | Vercel 서울 리전(icn1), Supabase 서울 리전(ap-northeast-2) |
| 빌드·검사 | pnpm workspace, Turborepo, ESLint, Vitest |
| 예정 | Spring Boot 결제·정산 API (R4), Expo 앱 (A1) |

스택을 고른 이유는 [의사결정 기록](docs/decisions/README.md)에 있다.

## 시작하기

Node.js 24.x, pnpm 12, Docker가 필요하다. pnpm 버전은 루트 `package.json`의 `packageManager` 필드를 따른다. Docker는 Supabase 로컬 스택을 실행하는 데 쓴다.

```bash
pnpm install
pnpm db:start
cp .env.example apps/web/.env.local
pnpm dev
```

`pnpm db:start`는 처음 실행할 때 Docker 이미지를 내려받으므로 몇 분이 걸린다. `apps/web/.env.local`에는 `pnpm db:status`가 출력하는 `API_URL`, `PUBLISHABLE_KEY`, `SECRET_KEY` 값을 채운다. 개발 서버는 http://localhost:3000 에서, Supabase Studio는 http://127.0.0.1:54323 에서 열린다.

| 명령 | 하는 일 |
|---|---|
| `pnpm dev` | 웹 개발 서버 |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm typecheck` | 타입 검사 |
| `pnpm lint` | ESLint 검사 |
| `pnpm test` | Vitest 테스트 |
| `pnpm db:start`, `pnpm db:stop` | Supabase 로컬 스택 시작과 종료 |
| `pnpm db:status` | 로컬 스택의 주소와 키 출력 |
| `pnpm db:reset` | 로컬 DB를 비우고 마이그레이션을 처음부터 다시 적용 |
| `node scripts/check-docs.mjs` | `docs/` 문서 구조 검사 |

## 프로젝트 구조

```
apps/web/          Next.js 웹 앱
packages/shared/   zod DTO, 데이터 접근 함수, 공통 로직
supabase/          마이그레이션과 로컬 설정
docs/              제품, 결정, 아키텍처, 기능 명세 문서
scripts/           저장소 검사 스크립트
.claude/           Claude Code 스킬과 훅
```

앱 코드는 Supabase를 직접 호출하지 않고 `packages/shared`의 함수만 호출한다([ADR-0003](docs/decisions/0003-data-access-boundary.md)).

## 개발 방식

- 새 테이블, 새 화면, 권한 규칙 변경은 요구사항, 설계 다이어그램, Task 이슈, PR 순서로 만든다. 절차는 [SDD 진행 가이드](docs/sdd-guide.md)에 있다.
- 계획된 작업은 Task 이슈 하나를 PR 하나로 끝내고, 작은 문서·설정 수정은 이슈 없이 PR로 처리한다. 모든 변경은 typecheck, lint, test를 통과하고 CodeRabbit 리뷰를 받은 뒤 PR로 병합한다.
- 사람과 코딩 에이전트가 함께 따르는 작업 규칙은 [AGENTS.md](AGENTS.md)에 있다.

## 문서

| 문서 | 내용 |
|---|---|
| [제품 비전](docs/product/vision.md) | 해결하려는 문제와 대상 사용자 |
| [출시 로드맵](docs/product/roadmap.md) | 단계별 범위, 진입 조건, 완료 조건 |
| [프로젝트 헌법](docs/constitution.md) | 모든 변경이 지키는 원칙과 확인 방법 |
| [의사결정 기록](docs/decisions/README.md) | ADR과 아직 정하지 않은 항목 |
| [아키텍처](docs/architecture/system-context.md) | 시스템 구성, 모노레포, 도메인, 배포 |
| [문서 지도](docs/README.md) | `docs/` 전체 구성과 작업별로 읽을 문서 |
