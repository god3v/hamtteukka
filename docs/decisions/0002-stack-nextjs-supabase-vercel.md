---
doc_type: explanation
status: accepted
updated: 2026-11-18
decided: 2026-11-18
---

# ADR-0002: Next.js·Supabase·Vercel 스택과 서울 리전

이 문서는 함뜨까 웹을 Next.js, Supabase, Vercel로 만들고 실행 위치를 서울 리전으로 고정한 결정을 설명한다. 독자는 이 스택을 고른 근거, 함께 비교한 대안을 채택하지 않은 이유, 출시 단계별로 예상하는 비용과 무료 플랜의 제약을 알 수 있다.

## 상태

| 항목 | 내용 |
|---|---|
| 상태 | 확정 (accepted) |
| 결정일 | 2026-11-18 |
| 결정자 | 프로젝트 소유자 |
| 이 ADR이 대신하는 이전 ADR | 없음 |
| 이 ADR을 대신하는 새 ADR | 없음 |

## 맥락

함뜨까는 서울에 있는 사용자를 대상으로 하고, 한 사람이 개발과 운영을 모두 맡는다. 따라서 첫 배포까지 걸리는 시간과 매달 드는 고정비를 함께 줄여야 했다. 기술 조사는 일곱 가지 조합을 비교했다([스택 조사](../research/2026-11-18-stack-options.md)).

조사에서 확인한 사실은 다음과 같다.

- 2026-11-18 기준 Next.js의 npm latest 버전은 16.4.6이고, Next.js 17은 정식 출시되지 않았다([npm next](https://www.npmjs.com/package/next)).
- Vercel은 서울 컴퓨트 리전 icn1을 제공하지만, 함수의 기본 리전은 iad1(워싱턴 D.C.)이다. 함수 리전을 DB와 같은 곳으로 지정해야 지연 시간이 줄어든다([Vercel icn1](https://vercel.com/docs/pricing/regional-pricing/icn1)).
- Supabase는 서울 리전(ap-northeast-2)을 제공한다. 일반 APAC 리전을 고르면 싱가포르 등에 배치될 수 있으므로 서울을 직접 선택해야 한다([Supabase 리전](https://supabase.com/docs/guides/platform/regions)).
- Vercel Hobby는 무료이지만 이용약관상 개인적이거나 비상업적인 용도로만 쓸 수 있다([Vercel 이용약관](https://vercel.com/legal/terms)). Pro는 개발자 좌석당 월 $20이다([Vercel 약관과 요금](https://vercel.com/terms)).
- Supabase Free는 $0이며, 1주 동안 활동이 없으면 프로젝트가 일시 중지된다. Pro는 월 $25부터다([Supabase 요금](https://supabase.com/pricing)).
- Supabase Free의 업로드 파일 크기 상한은 50MB다([Supabase Storage](https://supabase.com/docs/guides/storage/serving/downloads)).
- AWS Lightsail 서울 리전의 2GB 리눅스 인스턴스는 월 $12다([Lightsail 요금](https://aws.amazon.com/lightsail/pricing/)).

## 결정

- 웹은 Next.js 16 App Router로 만들고 버전을 16.4.x로 고정한다.
- 웹은 Vercel에 배포하고, 함수 리전을 icn1(서울)로 고정한다.
- Supabase 프로젝트는 ap-northeast-2(서울)에 만든다. Postgres, Auth, Storage, RLS, Cron, Queues를 Supabase에서 쓴다.
- 비용은 아래 단계를 따른다.

| 단계 | 구성 | 월 비용 |
|---|---|---|
| 개발과 비공개 베타 | Vercel Hobby, Supabase Free | $0 |
| R1 공개 출시 이후 | Vercel Pro ($20), Supabase Pro ($25) | 약 $45 |
| R4 유료 판매 이후 | 위 구성에 Spring 서버 추가 (예: Lightsail 서울 2GB, 약 $12) | 합계 ₩100,000 이하 유지 |

월 $45는 두 서비스의 포함 사용량 안에서 운영한다고 가정한 추정값이다. R1의 2주 비공개 베타가 끝나고 공개 출시할 때 두 서비스를 Pro로 바꾼다.

## 검토한 대안

### B안: Drizzle ORM과 Better Auth

Next.js와 Vercel은 그대로 두고, 데이터 접근은 Drizzle ORM으로, 인증은 Better Auth로 직접 구성하는 방안이다. Better Auth는 카카오와 네이버를 기본 제공자로 지원하고, 사용자와 세션 테이블이 내 스키마 안에 있어 호스팅을 바꾸기 쉽다([Better Auth 네이버](https://www.better-auth.com/docs/authentication/naver)).

그러나 RLS를 쓰지 않으면 모든 권한 검사를 서버 코드에 직접 써야 하므로, 1인 개발에서 권한 검사를 빠뜨릴 위험이 커진다고 추정했다. 파일 업로드, 서명된 URL 발급, 예약 작업도 서로 다른 서비스로 조립해야 해서 첫 배포 기간을 2~3주로 추정했다. DB로 Neon을 고르면 서울과 도쿄 리전이 없어 싱가포르 DB를 써야 한다([Neon 리전](https://neon.com/docs/introduction/regions)).

### C안: Kotlin과 Spring Boot API

개발자에게 익숙한 Kotlin과 Spring Boot로 REST API를 만들고, 웹 화면은 따로 배포하는 방안이다. 결제 연동 경험을 그대로 쓸 수 있고 플랫폼 종속이 가장 낮다.

그러나 Spring Security는 카카오와 네이버 제공자를 미리 정의하지 않으므로 provider 설정과 사용자 정보 매핑을 직접 작성해야 한다([Spring Security OAuth2](https://docs.spring.io/spring-security/reference/servlet/oauth2/login/core.html)). 서버 패치, 백업, 모니터링 같은 운영 업무도 생기며, 첫 배포 기간을 3~5주로 추정했다. 이 방안은 버리지 않고 R4에서 `apps/api`로 추가한다([ADR-0001](0001-monorepo-structure.md)).

### D안: Cloudflare Workers, D1, R2

Cloudflare에서 앱을 실행하고 SQLite 기반 D1과 R2 스토리지를 쓰는 방안이다. Workers Paid가 월 $5부터이고 R2는 전송 요금이 없어 비용이 가장 낮다([Cloudflare Workers 요금](https://developers.cloudflare.com/workers/platform/pricing/)).

그러나 D1은 서울을 지정할 수 없고 apac 위치 힌트만 제공하며, 힌트도 배치를 보장하지 않는다([D1 데이터 위치](https://developers.cloudflare.com/d1/configuration/data-location/)). OpenNext Cloudflare 어댑터는 Windows 지원을 보장하지 않으므로 지금의 Windows 개발 환경에서는 WSL이나 Linux CI가 필요하다([OpenNext Cloudflare](https://opennext.js.org/cloudflare)). 주문과 정산처럼 동시 쓰기가 많은 단계에서는 Postgres로 옮겨야 할 가능성도 크다고 추정했다.

## 결과

### 좋은 점

- 컴퓨트(Vercel icn1)와 DB, 스토리지(Supabase ap-northeast-2)를 모두 서울에 둔다.
- 카카오, 구글, Apple 로그인을 Supabase Auth가 기본으로 제공한다([ADR-0005](0005-auth-supabase-social-login.md)).
- private bucket과 서명된 URL로 권한을 확인한 뒤 PDF를 내려받게 하는 구조를 바로 만들 수 있다.
- supabase-js가 Expo에서도 동작하므로 웹과 앱이 같은 RLS 정책을 공유한다([Supabase Expo 가이드](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native)).
- 개발과 비공개 베타 기간에는 호스팅 비용이 들지 않는다.

### 감수할 점

- Vercel Hobby는 비상업 용도로 제한되므로 공개 출시부터는 Pro를 전제로 예산을 잡는다. 사업자등록 시점과의 관계는 OD-04에서 정한다([미결정 항목](README.md#미결정-항목)).
- Supabase Free는 1주 동안 활동이 없으면 일시 중지되고 업로드 상한이 50MB이므로, 개발 중에는 이 제약을 감안해야 한다.
- 네이버 로그인은 Supabase Auth가 기본 제공하지 않으므로 Custom OAuth Provider로 연결해야 한다([Supabase Custom OAuth](https://supabase.com/docs/guides/auth/custom-oauth-providers)).
- Supabase Auth와 RLS에 비즈니스 규칙이 깊게 묶이면 다른 인증 시스템으로 옮기기 어렵다(추정). [ADR-0003](0003-data-access-boundary.md)과 [ADR-0004](0004-rls-authorization.md)가 이 위험을 줄이는 규칙을 정한다.
- Vercel 서울 리전의 Fast Data Transfer 단가는 GB당 $0.35이므로, 큰 파일은 Vercel 함수를 거치지 않고 Storage 서명된 URL로 직접 내려받게 한다([Vercel icn1](https://vercel.com/docs/pricing/regional-pricing/icn1)).

## 관련 문서

- [스택 조사](../research/2026-11-18-stack-options.md): 일곱 가지 조합의 비교 기록
- [배포 구성](../architecture/deployment.md): 리전, 환경, 플랜 전환 절차
- [시스템 구성](../architecture/system-context.md): 외부 서비스와의 연결
- [ADR-0001: 모노레포 구조와 앱의 단계적 추가](0001-monorepo-structure.md)
- [ADR-0005: Supabase Auth와 카카오·구글 로그인](0005-auth-supabase-social-login.md)
