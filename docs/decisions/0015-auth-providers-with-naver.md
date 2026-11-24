---
doc_type: explanation
status: accepted
updated: 2026-11-24
decided: 2026-11-24
---

# ADR-0015: Supabase Auth와 카카오·구글·네이버 로그인

이 문서는 Supabase Auth를 인증 제공자로 쓰는 결정을 유지하면서, 네이버 로그인을 R1+에서 R0로 앞당겨 카카오, 구글과 함께 첫 출시에 제공하기로 한 결정을 설명한다. 독자는 로그인 수단마다 언제 어떤 방법으로 연결하는지, 네이버의 비표준 사용자 정보 응답을 어떻게 처리하는지 알 수 있다.

## 상태

| 항목 | 내용 |
|---|---|
| 상태 | 확정 (accepted) |
| 결정일 | 2026-11-24 |
| 결정자 | 프로젝트 소유자 |
| 이 ADR이 대신하는 이전 ADR | [ADR-0005](0005-auth-supabase-social-login.md) |
| 이 ADR을 대신하는 새 ADR | 없음 |

## 맥락

[ADR-0005](0005-auth-supabase-social-login.md)는 카카오와 구글을 R0에, 네이버를 R1+에 연결하기로 정했다. 네이버를 미룬 이유는 Supabase Auth가 네이버를 기본 제공하지 않아 커스텀 OAuth 제공자로 연결해야 하고, 그 방식의 안정성을 따로 검증해야 했기 때문이다.

2026-11-24에 001 계정 설계를 마친 뒤, 프로젝트 소유자는 한국 사용자가 많이 쓰는 네이버 로그인을 R0 구현에 함께 넣기로 했다. 이 결정을 위해 확인한 사실은 다음과 같다([네이버 로그인 연결 확인](../research/2026-11-24-naver-login-supabase.md)).

- Supabase의 커스텀 OAuth/OIDC 제공자는 OIDC가 아닌 OAuth2 제공자도 인가, 토큰, 사용자 정보 주소를 넣어 등록할 수 있다. Free 프로젝트는 커스텀 제공자를 3개까지 쓸 수 있다([Supabase 커스텀 제공자 문서](https://supabase.com/docs/guides/auth/custom-oauth-providers)).
- 커스텀 제공자에 `email_optional`을 켜면 이메일이 없는 사용자도 가입할 수 있다(같은 문서).
- 네이버의 사용자 정보 응답은 사용자 정보를 `response` 객체 안에 감싸서 돌려주므로, Supabase가 기대하는 평평한 형식과 다르다. 커뮤니티 프로젝트는 응답을 바꿔 주는 중계 함수를 사용자 정보 주소로 등록해 이 문제를 푼다([supabase-naver-oidc-proxy](https://github-users.yhajoa.workers.dev/h2026kr/supabase-naver-oidc-proxy)).
- Supabase Auth는 제공자가 확인한 이메일이 같으면 다른 제공자의 로그인을 기존 사용자에 자동으로 연결한다. 001 요구사항 Q-19는 이때 세션을 끝내고 가입한 수단을 안내하기로 정했다([Supabase 계정 연결 문서](https://supabase.com/docs/guides/auth/auth-identity-linking)).

## 결정

- 인증 제공자는 Supabase Auth로 한다.
- 로그인 수단은 아래 시점에 추가한다.

| 로그인 수단 | 추가 시점 | 연결 방법 |
|---|---|---|
| 카카오 | R0 기반 | Supabase Auth 기본 제공자 |
| 네이버 | R0 기반 | Supabase 커스텀 OAuth 제공자(`oauth2` 유형)와 웹 앱의 사용자 정보 변환 경로 |
| 구글 | R0 기반 | Supabase Auth 기본 제공자 |
| Apple | A1 앱 | Supabase Auth 기본 제공자 |

- 네이버 제공자의 사용자 정보 주소에는 Supabase Edge Function이 아니라 `apps/web`의 경로를 등록한다. 이 경로는 받은 액세스 토큰으로 네이버 사용자 정보를 조회하고, `response.id`를 `sub`로 바꾼 평평한 형식으로 응답한다. 응답을 바꾸는 순수 함수는 `packages/shared`에 두고 테스트한다.
- 네이버 제공자는 `email_optional`을 켜서, 네이버가 이메일을 주지 않아도 가입할 수 있게 한다.
- 회원은 로그인 제공자와 그 제공자의 사용자 ID 조합 `(provider, provider_user_id)`로 식별한다. 이메일은 선택 속성으로만 저장하고 회원 식별 키로 쓰지 않는다.
- 같은 이메일 때문에 다른 수단이 기존 회원에 자동으로 연결되면, 가입할 때 쓴 수단으로 로그인하라고 안내한다(001 Q-19).
- R4의 Spring 서버는 Supabase가 발급한 JWT를 JWKS로 받은 공개 키로 검증한다. 이를 위해 Supabase 프로젝트는 비대칭 서명 키를 쓴다.

## 검토한 대안

### 네이버를 계획대로 R1+에 추가

ADR-0005의 일정대로 R0에는 카카오와 구글만 두는 방안이다. R0 작업량이 줄고, 커스텀 제공자의 안정성을 R1 공개 출시 뒤에 따로 검증할 수 있다.

그러나 R1 공개 출시 때 네이버 로그인이 없으면 네이버를 주로 쓰는 사용자가 다른 수단으로 가입했다가 나중에 네이버를 쓰지 못하게 된다. 회원은 가입한 수단으로만 로그인하기 때문이다(001 Q-19). 그래서 첫 출시부터 세 수단을 함께 제공하기로 했다.

### 사용자 정보 변환을 Supabase Edge Function으로 처리

커뮤니티 프로젝트처럼 Supabase Edge Function을 사용자 정보 주소로 등록하는 방안이다. Supabase 안에서 모든 인증 처리가 끝난다.

그러나 Edge Function은 Deno에서 실행되어 모노레포의 TypeScript 패키지와 테스트, 배포 흐름 밖에 놓인다. 웹 앱의 경로로 두면 같은 CI가 검사하고 Vercel이 함께 배포하므로 이 방안은 채택하지 않았다.

### Better Auth

Better Auth는 네이버를 기본 제공자로 지원한다. 그러나 ADR-0005에서 판단한 대로, 세션이 Supabase Auth JWT가 아니어서 RLS 중심의 권한 검사를 그대로 쓸 수 없다고 추정했다. 그래서 이번에도 채택하지 않았다.

## 결과

### 좋은 점

- 첫 출시부터 카카오, 네이버, 구글 가운데 사용자가 쓰는 수단으로 가입할 수 있다.
- 세 수단 모두 Supabase Auth 사용자이므로, RLS 정책과 회원 구조는 로그인 수단과 관계없이 같다.
- 사용자 정보 변환 경로가 모노레포 안에 있어 테스트와 배포를 웹 앱과 함께 관리한다.

### 감수할 점

- 네이버 연결은 Supabase가 공식으로 안내하는 방식이 아니라 사용자 정보 변환에 기대는 방식이다. Supabase나 네이버가 응답 형식을 바꾸면 변환 경로를 고쳐야 한다(추정).
- 커스텀 제공자 한도 3개 가운데 하나를 네이버가 쓴다.
- 네이버 로그인을 모든 사용자에게 열려면 검수가 필요한지, 네이버 이메일을 확인된 이메일로 볼 수 있는지는 확인하지 못했다. 구현 Task에서 네이버 개발자센터와 로컬 스택으로 확인한다.
- 이메일로 회원을 식별하지 않으므로, 한 사람이 서로 다른 로그인 수단으로 가입하면 별도 회원이 될 수 있다. 같은 이메일로 자동 연결된 경우에는 가입한 수단을 안내한다.
- A1에서 Apple 로그인을 추가할 때는 한국 개발자에게 요구되는 서버 간 알림 엔드포인트를 함께 만든다([Apple 개발자 소식](https://developer.apple.com/news/?id=j9zukcr6)).

## 관련 문서

- [ADR-0005: Supabase Auth와 카카오·구글 로그인](0005-auth-supabase-social-login.md): 이 ADR이 대신하는 결정
- [네이버 로그인 연결 확인](../research/2026-11-24-naver-login-supabase.md): 이 결정의 근거 조사
- [001 계정 요구사항](../specs/001-account/requirements.md), [001 설계](../specs/001-account/design/sequence.md)
- [시스템 구성](../architecture/system-context.md): 인증 흐름이 지나는 외부 서비스
- [ADR-0003: Supabase 접근을 packages/shared로 제한](0003-data-access-boundary.md), [ADR-0004: RLS를 1차 권한 검사로 사용](0004-rls-authorization.md)
