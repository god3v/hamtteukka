---
doc_type: reference
status: active
updated: 2026-11-18
---

# 함뜨까 프로젝트 헌법

이 문서는 함뜨까의 요구사항, 설계, 구현이 모두 지켜야 하는 원칙을 정한다. 원칙마다 규칙과 근거 ADR, 위반을 잡아내는 게이트나 실행 검사를 함께 적어서 사람과 에이전트가 같은 기준으로 변경을 판단하게 한다.

`/sdd-design`과 `/sdd-tasks`는 이 문서를 읽고 설계와 작업 목록이 원칙을 어기지 않는지 점검한다. 원칙과 다른 결정이 필요하면 설계나 코드에 예외를 두지 않고, 마지막 절의 헌법 변경 절차를 따른다.

## 원칙 목록

| ID | 원칙 | 근거 | 주로 확인하는 곳 |
|---|---|---|---|
| P-01 | SDD 적용 기준 | ADR-0010 | 착수 판단, 게이트 4 |
| P-02 | 문서와 다이어그램 우선 설계 | ADR-0010 | 게이트 1, 게이트 2 |
| P-03 | 데이터 접근 경계 | ADR-0003 | lint, 게이트 2 |
| P-04 | RLS 권한과 정책 기록 | ADR-0004 | 게이트 2, `/sdd-verify` |
| P-05 | 인증 식별 | ADR-0005 | 게이트 2 |
| P-06 | 마이그레이션 소유권 | ADR-0006 | 게이트 2, 게이트 4 |
| P-07 | 판매 대비 데이터 | ADR-0007 | 게이트 2, DB 제약 |
| P-08 | 금전 흐름 금지와 충전식 잔액 금지 | ADR-0009 | R4 진입 조건, 게이트 2 |
| P-09 | 테스트와 검증 | ADR-0010 | CI, `/sdd-verify` |
| P-10 | 보안 | 헌법 직접 규칙, ADR-0004 | 게이트 2, 게이트 4 |
| P-11 | 개인정보 | ADR-0005, ADR-0007 | 게이트 1, 게이트 2 |
| P-12 | 모바일 우선과 다크 모드 | 기능 목록 F-UX-01, F-UX-02 | 게이트 2, 게이트 4 |
| P-13 | 1 Task = 1 PR | ADR-0011, ADR-0012 | 게이트 3, 게이트 4 |
| P-14 | 의존성 버전 고정 | ADR-0002, 헌법 직접 규칙 | CI, 게이트 4 |
| P-15 | 한국어 문서 | ADR-0010 | 모든 게이트 |

## 확인 방법에 쓰는 이름

원칙마다 적은 "확인 방법"은 아래 게이트와 검사를 가리킨다. 게이트를 진행하는 자세한 방법은 [SDD 흐름으로 기능 만들기](sdd-guide.md)에 있다.

| 이름 | 뜻 |
|---|---|
| 게이트 1 | `/sdd-spec` 끝에서 사용자가 requirements.md를 승인한다 |
| 게이트 2 | `/sdd-design` 끝에서 사용자가 설계 문서를 승인한다 |
| 게이트 3 | `/sdd-tasks`가 이슈를 만들기 전에 사용자가 Task 목록을 확인한다 |
| 게이트 4 | `/sdd-implement`가 연 PR을 사용자가 리뷰한다 |
| CI | PR마다 typecheck, lint, test를 실행한다 |
| `/sdd-verify` | 병합된 코드를 요구사항의 AC와 설계 문서에 대조한다 |

## P-01 SDD 적용 기준

- **규칙**: 테이블을 추가하거나, 화면을 추가하거나, 권한 규칙을 바꾸는 변경은 `/sdd-spec`부터 시작하는 SDD 흐름을 거친다. 버그 수정, 문구 변경, 리팩터링은 SDD 없이 PR로 바로 진행하며, 이슈가 필요한지는 P-13을 따른다.
- **근거**: [ADR-0010 카카오페이 흐름 기반 SDD와 다이어그램 중심 설계](decisions/0010-sdd-diagram-first.md). 카카오페이 사례에서는 작은 변경을 스펙 흐름으로 처리할지 정하는 기준이 불분명하다는 점이 단점으로 꼽혔다([출처](https://tech.kakaopay.com/post/ifkakao-agentic-coding/)).
- **확인 방법**: 작업을 시작할 때 [SDD 적용 기준 표](sdd-guide.md#sdd-적용-기준)로 판단한다. 게이트 4에서는 마이그레이션이나 새 화면 경로를 추가하는 PR이 Feature의 하위 Task에서 나왔는지 확인한다.

## P-02 문서와 다이어그램 우선 설계

- **규칙**: 구현은 승인된 requirements.md와 승인된 설계 문서를 근거로만 시작한다. 설계는 Mermaid 다이어그램과 그 아래의 표로 기록하고, spec.md, plan.md, tasks.md는 만들지 않는다. 다이어그램 유형은 flowchart, sequenceDiagram, classDiagram, erDiagram, stateDiagram-v2, timeline, gantt로 한정한다.
- **근거**: [ADR-0010 카카오페이 흐름 기반 SDD와 다이어그램 중심 설계](decisions/0010-sdd-diagram-first.md). GitHub는 사용하는 Mermaid 버전을 공개하지 않으며, 베타 유형이 GitHub에서 렌더링되는지는 확인하지 못했다([GitHub 문서](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams), [Mermaid 문법 목록](https://mermaid.js.org/intro/syntax-reference.html)).
- **확인 방법**: 게이트 1과 게이트 2에서 사용자가 문서를 승인한다. 게이트 2에서는 GitHub 화면에서 다이어그램이 실제로 렌더링되는지도 확인한다.

## P-03 데이터 접근 경계

- **규칙**: supabase-js는 packages/shared 안에서만 import한다. shared 함수는 zod로 정의한 자체 DTO 타입과 자체 오류 타입을 반환하고, Supabase 타입이나 PostgrestError를 밖으로 노출하지 않는다. apps/web의 Server Action은 shared 함수를 호출하는 얇은 래퍼로만 쓴다.
- **근거**: [ADR-0003 Supabase 접근을 packages/shared로 제한](decisions/0003-data-access-boundary.md). A1에서 추가할 Expo 앱은 Server Action을 호출할 수 없으므로 데이터 접근 로직을 shared에 모은다.
- **확인 방법**: apps의 ESLint `no-restricted-imports` 규칙이 supabase-js import를 lint 오류로 만든다. 게이트 2에서는 design/domain.md의 함수 인터페이스 표에 Supabase 타입이 없는지 확인한다.

## P-04 RLS 권한과 정책 기록

- **규칙**: 브라우저와 앱이 Supabase를 직접 호출하는 동안에는 RLS를 1차 권한 검사로 쓴다. 브라우저나 앱이 읽거나 쓰는 테이블에는 모두 RLS를 켜고, 허용하는 작업마다 정책을 만든다. 모든 정책은 해당 기능의 design/erd.md에 있는 RLS 정책 표에 기록한다.
- **근거**: [ADR-0004 RLS를 1차 권한 검사로 사용](decisions/0004-rls-authorization.md). 정책 표는 나중에 권한 검사를 Spring 서버로 옮길 때 빠짐없이 옮겼는지 대조하는 목록이 된다.
- **확인 방법**: 게이트 2에서 정책 표를 검토한다. `/sdd-verify`는 병합된 마이그레이션의 정책을 정책 표와 대조하고, 차이가 있으면 Task 이슈를 연다. 권한을 다루는 AC는 다른 사용자의 데이터에 접근하지 못하는지 테스트로 확인한다.

## P-05 인증 식별

- **규칙**: Supabase Auth를 신원 제공자로 쓴다. 사용자는 (provider, provider_user_id) 조합으로 식별하고, 이메일을 사용자 키로 쓰지 않는다. 이메일은 없어도 되는 선택 속성으로 둔다.
- **근거**: [ADR-0005 Supabase Auth와 카카오·구글 로그인](decisions/0005-auth-supabase-social-login.md). 카카오 로그인은 비즈 앱으로 전환해야 이메일을 받을 수 있다([출처](https://supabase.com/docs/guides/auth/social-login/auth-kakao)). R4에서 추가하는 Spring 서버는 Supabase JWT를 JWKS로 검증한다.
- **확인 방법**: 게이트 2에서 erd.md에 이메일을 UNIQUE 사용자 키나 조인 키로 쓰는 테이블이 없는지 확인한다.

## P-06 마이그레이션 소유권

- **규칙**: public 스키마와 commerce가 아닌 스키마는 supabase/migrations의 SQL 마이그레이션이 소유한다. R4에서 만드는 commerce 스키마(orders, payments, ledger, payouts)는 Spring의 Flyway가 소유한다. 두 도구는 같은 테이블을 바꾸지 않고, 스키마 변경은 그 스키마를 소유한 도구의 마이그레이션으로만 반영한다.
- **근거**: [ADR-0006 DB 마이그레이션 소유권을 스키마별로 분리](decisions/0006-migration-ownership.md).
- **확인 방법**: 게이트 2에서 erd.md 테이블 설명 표의 스키마 열을 확인한다. 게이트 4에서는 PR이 고친 마이그레이션 경로가 테이블을 소유한 도구와 맞는지 확인한다.

## P-07 판매 대비 데이터

- **규칙**:
  - 작가 프로필은 회원과 별도 테이블로 둔다.
  - 무료 도안을 받을 때도 내 도안함(entitlements)에 기록하고, source(FREE_CLAIM, PURCHASE, GIFT, ADMIN), granted_at, revoked_at, first_download_at을 남긴다.
  - 도안 가격 필드는 처음부터 두고, R4 전까지는 CHECK 제약으로 0만 허용한다.
  - 첫 다운로드 시각과 동의 기록은 디지털 콘텐츠 청약철회를 판단하는 근거로 보존한다.
  - 수수료율, 원천징수율, 정산 주기는 코드 상수로 두지 않고 적용 시작일이 있는 설정 테이블로 관리한다.
- **근거**: [ADR-0007 판매에 대비한 데이터 원칙](decisions/0007-sales-ready-data-model.md). 청약철회 제한 사유와 표시 의무를 이행했다는 사실은 사업자가 증명해야 한다는 대법원 판단이 있다([2018다214746](https://korea.legal/wiki/2018%eb%8b%a4214746/)).
- **확인 방법**: 게이트 2에서 erd.md가 위 항목을 따르는지 확인한다. 가격 CHECK 제약은 DB가 0이 아닌 가격을 거부하는지 테스트로 확인한다. 게이트 4에서는 요율을 코드 상수로 넣은 변경이 없는지 확인한다.

## P-08 금전 흐름 금지와 충전식 잔액 금지

- **규칙**: 구매자가 낸 대금을 운영자 계좌로 받아 작가에게 송금하는 흐름은 만들지 않는다. 판매 대금은 PG 지급대행이나, PortOne 파트너 정산과 지급대행 PG의 조합으로만 정산한다. 충전식 잔액, 포인트, 지갑은 만들지 않고 할인은 가격 할인이나 쿠폰으로 처리한다.
- **근거**: [ADR-0009 판매 대금은 PG 지급대행으로만 정산](decisions/0009-payout-via-pg.md). 플랫폼이 대금을 받아 정산을 대행하면 전자지급결제대행업 등록 대상이고, 미등록 영업은 형사 처벌 대상이다([금융위원회](https://www.fsc.go.kr/no010102/82523)). 충전식 잔액은 선불전자지급수단 발행업 등록 문제로 이어질 수 있다(추정, [금융위원회](https://www.fsc.go.kr/no010101/82339)). 자세한 내용은 [결제와 법률 조사](research/2026-11-18-payments-and-law.md)에 있다.
- **확인 방법**: R4 진입 조건은 사업자등록, 통신판매업 신고, 거래 구조 ADR과 PG ADR 확정이다. 게이트 2에서는 잔액, 충전, 지갑을 뜻하는 테이블이나 열이 없는지 확인한다.

## P-09 테스트와 검증

- **규칙**:
  - AC를 확인하는 테스트는 이름 앞에 기능 번호와 AC ID를 붙인다. 예: `test("003/AC-04 ...")`
  - 병합하기 전에 typecheck, lint, test가 모두 통과해야 한다.
  - 에이전트가 "확인했다"거나 "통과했다"고 보고한 내용은 근거로 쓰지 않는다. 실제로 실행한 검사의 종료 코드로 판단한다.
  - 검사 명령의 출력을 파이프로 잘라서 실패 종료 코드를 가리지 않는다.
- **근거**: [ADR-0010 카카오페이 흐름 기반 SDD와 다이어그램 중심 설계](decisions/0010-sdd-diagram-first.md). 카카오페이 사례에서는 에이전트가 검증 범위를 과장해 보고하는 경향이 있었고, lint 출력을 tail로 넘겨 실패가 통과로 기록된 일이 있었다([출처](https://tech.kakaopay.com/post/ai-agent-2/)).
- **확인 방법**: CI가 PR마다 typecheck, lint, test를 실행하고, 하나라도 실패하면 병합하지 않는다. `/sdd-verify`는 모든 AC에 해당하는 테스트나 확인 결과가 있는지 대조한다.

## P-10 보안

- **규칙**:
  - 비밀 값(API 키, OAuth client secret, service-role 키, 로컬 환경 변수 파일)은 커밋하지 않는다.
  - service-role 키는 서버에서 실행되는 코드에서만 읽는다. 브라우저 번들에 포함되는 공개 환경 변수(Next.js의 `NEXT_PUBLIC_` 접두사)에는 넣지 않는다.
  - Storage 버킷은 private으로 만든다. 파일은 권한을 확인한 뒤 짧은 만료 시간의 signed URL로만 제공한다.
- **근거**: 위 세 규칙은 대응 ADR 없이 이 헌법에서 직접 정했다. [ADR-0004 RLS를 1차 권한 검사로 사용](decisions/0004-rls-authorization.md)에 따라 RLS가 권한을 검사하는데, service-role 키가 브라우저에 노출되면 누구나 RLS를 거치지 않고 데이터에 접근할 수 있다. 개별 signed URL은 발급한 뒤 취소할 수 없고 객체 삭제나 서명 키 교체로만 무효화된다([Supabase 문서](https://supabase.com/docs/guides/storage/serving/downloads)).
- **확인 방법**: 게이트 2에서 erd.md와 sequence.md에 적힌 버킷 공개 여부와 URL 발급 흐름을 확인한다. 비밀 값 커밋을 자동으로 막는 검사는 아직 정하지 않았으므로, 게이트 4에서 변경 파일 목록과 PR 체크리스트로 확인한다.

## P-11 개인정보

- **규칙**:
  - 기능에 필요한 개인정보만 수집하고, 요구사항에 항목마다 수집 목적을 적는다.
  - 회원이 약관과 개인정보 처리방침에 동의하면, 동의한 문서의 버전과 동의 시각을 함께 기록한다.
  - 탈퇴 절차는 가입 절차보다 어렵게 만들지 않는다.
  - 만 14세 미만 가입 처리는 [미결정 사항](decisions/README.md) OD-01에서 정한다.
- **근거**: [ADR-0005 Supabase Auth와 카카오·구글 로그인](decisions/0005-auth-supabase-social-login.md), [ADR-0007 판매에 대비한 데이터 원칙](decisions/0007-sales-ready-data-model.md). 개인정보 보호법 제38조 제4항은 열람과 삭제 같은 권리 행사 절차를 수집 절차보다 어렵지 않게 만들도록 요구한다([출처](https://casenote.kr/법령/개인정보_보호법/제38조)).
- **확인 방법**: 게이트 1에서 수집 항목과 목적을 확인한다. 게이트 2에서는 동의 기록 테이블에 문서 버전 열이 있는지, screens.md의 탈퇴 경로가 가입 경로보다 단계가 많지 않은지 확인한다.

## P-12 모바일 우선과 다크 모드

- **규칙**: 화면은 모바일 너비를 기준으로 먼저 설계하고, 넓은 화면은 그 배치를 확장해서 만든다. 모든 화면은 라이트 모드와 다크 모드에서 모두 읽을 수 있어야 한다.
- **근거**: [기능 목록](product/feature-catalog.md)의 F-UX-01(반응형 모바일 웹)과 F-UX-02(다크 모드)는 R0에 들어 있다. 이 원칙을 따로 다룬 ADR은 없다.
- **확인 방법**: 게이트 2에서 screens.md의 화면이 모바일 너비 기준으로 그려졌는지 확인한다. 게이트 4에서는 화면을 바꾼 PR이 모바일 너비와 다크 모드에서 확인한 결과를 적었는지 확인한다.

## P-13 1 Task = 1 PR

- **규칙**: 계획된 작업(`/sdd-tasks`가 만든 Task, 출시 단계 계획에 등록한 Task(R0 인프라 작업 포함), 기록할 가치가 있는 버그)은 Task나 Bug 이슈 하나를 PR 하나로 끝내고, PR 본문에 `Closes #이슈 번호`를 적는다. 문서 문구, 템플릿, 설정의 작은 수정과 동작을 바꾸지 않는 작은 리팩터링은 이슈 없이 처리한다. 이런 변경은 관련된 PR이 열려 있으면 그 PR에 함께 넣고 본문에 따로 적으며, 없으면 이슈 없는 PR로 연다. 모든 변경은 PR을 거쳐 main에 들어간다. PR의 변경 줄 수는 약 200줄을 기준으로 삼고, 크게 넘을 것 같으면 `/sdd-tasks` 단계에서 Task를 나눈다. 이 기준은 지침이며 강제 상한은 아니다.
- **근거**: [ADR-0011 GitHub Issues·Projects로 업무 관리](decisions/0011-github-issues-projects.md), [ADR-0012 계획된 작업만 이슈로 관리](decisions/0012-issue-for-planned-work-only.md). 카카오페이손해보험은 설계 문서와 작업 분해를 적용한 뒤 PR당 변경 줄 수 중앙값이 246줄에서 158줄로 줄었다고 보고했다([출처](https://tech.kakaopay.com/post/kakaopayins-slow-pr-fast-dev/)).
- **확인 방법**: 게이트 3에서 Task마다 PR 하나로 끝날 크기인지 확인한다. 게이트 4에서 PR의 변경 줄 수와 `Closes`로 연결된 이슈를 확인하고, 이슈 없이 함께 넣은 작은 수정이 있으면 PR 본문에 따로 적었는지 확인한다. main에 직접 커밋하지 않는 규칙은 R0 작업 #5에서 설정할 main 브랜치 보호로 확인한다.

## P-14 의존성 버전 고정

- **규칙**: package.json의 의존성은 범위 지정자 없이 정확한 버전으로 적고, pnpm-lock.yaml을 커밋한다. 의존성 버전을 올리는 변경은 기능 변경과 섞지 않고 별도 Task로 진행한다.
- **근거**: [ADR-0002 Next.js·Supabase·Vercel 스택과 서울 리전](decisions/0002-stack-nextjs-supabase-vercel.md)은 Next.js 버전을 16.4.x로 고정한다. 범위 지정자 금지, lockfile 커밋, CI의 `--frozen-lockfile` 설치, 버전 올리기를 별도 Task로 진행하는 규칙은 대응 ADR 없이 이 헌법에서 직접 정했다. 2026-11-18 기준으로 Prisma CLI의 latest 태그가 클라이언트와 다른 버전을 가리킨 사례가 있어서, 태그를 믿지 않고 버전을 명시한다([npm](https://www.npmjs.com/package/prisma)). 자세한 내용은 [스택 선택지 조사](research/2026-11-18-stack-options.md)에 있다.
- **확인 방법**: CI는 lockfile을 바꾸지 않는 설치(`pnpm install --frozen-lockfile`)로 시작한다. 게이트 4에서 package.json 변경에 범위 지정자가 없는지 확인한다.

## P-15 한국어 문서

- **규칙**: docs/ 아래의 문서, 스펙, 이슈, PR 본문, 커밋 요약은 한국어로 쓴다. 문서는 평서체(-다)로 쓰고, 기술 용어와 코드 식별자는 원어를 유지한다. 커밋 메시지는 Conventional Commits 접두사 뒤에 한국어 요약을 붙인다.
- **근거**: [ADR-0010 카카오페이 흐름 기반 SDD와 다이어그램 중심 설계](decisions/0010-sdd-diagram-first.md). 카카오페이 사례에서는 모든 명령 뒤에 한국어로 작성하라는 지시를 붙여 팀이 문서를 읽기 쉽게 만들었다([출처](https://tech.kakaopay.com/post/ifkakao-agentic-coding/)).
- **확인 방법**: 게이트 1부터 게이트 4까지 사용자가 산출물을 검토하면서 확인한다.

## 헌법 변경 절차

이 문서는 ADR을 거쳐서만 바꾼다. 원칙을 코드나 설계에서 조용히 어기면 이후 단계가 어떤 기준을 따라야 하는지 알 수 없게 되기 때문이다. 대응 ADR이 없는 규칙(P-10, P-12, P-14의 일부)을 바꿀 때도 아래 절차에 따라 새 ADR을 먼저 쓴다.

1. 바꿀 원칙, 바꾸는 이유, 영향을 받는 스펙과 코드를 적은 ADR을 `proposed` 상태로 [docs/decisions/](decisions/README.md)에 추가한다.
2. 사용자가 ADR을 승인하면 상태를 `accepted`로 바꾸고, 같은 PR에서 이 문서의 규칙, 근거, 확인 방법을 고친다.
3. 원칙을 없앨 때는 항목을 지우지 않고 "폐지됨"과 해당 ADR 링크를 남긴다. 폐지한 번호는 다시 쓰지 않는다.
4. 바뀐 원칙이 진행 중인 스펙에 영향을 주면, [수정 규칙](sdd-guide.md#수정-규칙)에 따라 requirements.md나 설계 문서부터 다시 검토한다.
5. 기존 ADR은 지우지 않는다. 결정을 바꿀 때는 새 ADR을 쓰고 기존 ADR의 상태를 대체됨(superseded)으로 바꾼다.
