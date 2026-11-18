# 함뜨까 (hamtteukka)

함뜨까는 뜨개 프로젝트 기록 도구와 도안 공유를 하나의 웹 서비스로 잇는 1인 사이드 프로젝트다. 첫 출시에서는 프로젝트 기록, 단수 카운터, 게이지 기록, 내 도안 파일 첨부 같은 개인 도구를 제공하고, 이후 무료 도안 배포, 커뮤니티, 유료 도안 판매로 넓혀 간다.

## 현재 상태

지금은 R0 기반 단계를 준비하고 있다. 요구사항, 설계, 의사결정 문서 체계를 먼저 만들었고, 코드는 R0 작업 이슈에서 작성한다. 진행 상황은 [마일스톤](https://github.com/god3v/hamtteukka/milestones)과 [이슈](https://github.com/god3v/hamtteukka/issues)에서 확인한다.

## 기술 스택

| 영역 | 선택 | 결정 문서 |
|---|---|---|
| 웹 | Next.js (App Router), Vercel 서울 리전 | [ADR-0002](docs/decisions/0002-stack-nextjs-supabase-vercel.md) |
| 데이터·인증·파일 | Supabase 서울 리전 (Postgres, Auth, Storage, RLS) | [ADR-0002](docs/decisions/0002-stack-nextjs-supabase-vercel.md) |
| 저장소 구조 | pnpm 모노레포 (`apps/web`, `packages/shared`, `supabase/`) | [ADR-0001](docs/decisions/0001-monorepo-structure.md) |
| 결제·정산 (R4 예정) | Spring Boot API, PG 지급대행 | [ADR-0009](docs/decisions/0009-payout-via-pg.md) |
| 앱 (A1 예정) | Expo | [ADR-0001](docs/decisions/0001-monorepo-structure.md) |

## 문서

문서 전체 지도는 [docs/README.md](docs/README.md)에 있다. 처음 읽는다면 아래 순서를 권한다.

1. [제품 방향](docs/product/vision.md)
2. [출시 로드맵](docs/product/roadmap.md)
3. [프로젝트 헌법](docs/constitution.md)
4. [SDD 진행 가이드](docs/sdd-guide.md)
5. [의사결정 기록](docs/decisions/README.md)
