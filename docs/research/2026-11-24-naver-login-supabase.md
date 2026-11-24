---
doc_type: reference
status: record
updated: 2026-11-24
---

# Supabase에 네이버 로그인을 연결하는 방법 확인

이 문서는 네이버 로그인을 R0 계정 기능에 넣을 수 있는지 판단하려고 2026-11-24에 확인한 Supabase 문서와 네이버 로그인 자료의 내용을 기록한다. Supabase의 커스텀 OAuth 제공자 기능, 네이버 사용자 정보 응답의 형식, 확인하지 못한 항목이 [ADR-0015](../decisions/0015-auth-providers-with-naver.md)의 근거가 된다.

## 범위

이 문서는 2026-11-24에 확인한 내용을 그 시점 기준으로 고정한 기록이다. 이후에는 본문을 고치지 않으며, 정정할 내용이 생기면 문서 끝에 정정 기록을 덧붙인다.

- 판정은 세 가지로 적는다. Supabase나 네이버의 공식 문서에서 확인한 내용은 '확인함', 개발자 글이나 커뮤니티 프로젝트에서만 확인한 내용은 '제3자 자료', 찾지 못한 내용은 '확인하지 못함'이다.
- 네이버 개발자센터의 애플리케이션 설정 화면은 열지 않았다.

## Supabase 커스텀 OAuth 제공자

| 내용 | 판정 | 출처 |
|---|---|---|
| Supabase Auth는 카카오와 구글은 기본 제공자로 지원하지만 네이버는 기본 제공하지 않는다. | 확인함 | [Supabase 커스텀 제공자 문서](https://supabase.com/docs/guides/auth/custom-oauth-providers), [ADR-0005](../decisions/0005-auth-supabase-social-login.md)의 맥락 |
| 커스텀 OAuth/OIDC 제공자로 표준을 따르는 제공자를 연결할 수 있고, OIDC가 아닌 OAuth2 제공자는 `oauth2` 유형으로 인가, 토큰, 사용자 정보 주소를 직접 넣어 등록한다. | 확인함 | [Supabase 커스텀 제공자 문서](https://supabase.com/docs/guides/auth/custom-oauth-providers) |
| Free 프로젝트는 커스텀 제공자를 3개까지 등록할 수 있고, Pro 이상은 제한이 없다. | 확인함 | 같은 문서 |
| 제공자는 기본으로 이메일을 돌려줘야 하며, `email_optional`을 켜면 이메일이 없는 사용자도 가입할 수 있다. | 확인함 | 같은 문서 |
| 사용자 정보 응답의 필드를 다른 이름으로 연결하는 설정은 문서에 없다. | 확인함 | 같은 문서 |
| 이 기능이 정식 기능인지 베타인지는 문서에 적혀 있지 않다. | 확인하지 못함 | 같은 문서 |
| Supabase Auth는 제공자가 확인한 이메일이 같으면 다른 제공자의 로그인을 기존 사용자에 자동으로 연결하며, 이 동작을 끄는 설정은 문서에 없다. | 확인함 | [Supabase 계정 연결 문서](https://supabase.com/docs/guides/auth/auth-identity-linking) |

## 네이버 사용자 정보 응답

| 내용 | 판정 | 출처 |
|---|---|---|
| 네이버의 사용자 정보 주소는 `https://openapi.naver.com/v1/nid/me`이고, 액세스 토큰을 `Authorization: Bearer` 헤더로 보낸다. | 제3자 자료 | [개발자 글](https://velog.io/@dldmswjd322/node.js-네이버-로그인을-통해-회원-정보-받아오기), [개발자 글](https://velog.io/@seowj0710/Spring-네이버-로그인-API-구현) |
| 응답은 `resultcode`, `message`, `response`로 이루어지고, 사용자 ID와 이메일, 이름은 `response` 객체 안에 있다. `response.id`가 같은 사람을 가리키는 식별자다. | 제3자 자료 | 같은 글 |
| Supabase는 `sub`, `email`, `name`이 맨 위에 있는 평평한 형식을 기대하므로, 네이버 응답을 그대로 쓰면 이메일을 읽지 못했다는 오류가 난다. 커뮤니티 프로젝트는 응답의 `response`를 꺼내고 `id`를 `sub`로 바꾸는 중계 함수를 사용자 정보 주소로 등록해 이 문제를 푼다. | 제3자 자료 | [supabase-naver-oidc-proxy](https://github-users.yhajoa.workers.dev/h2026kr/supabase-naver-oidc-proxy) |
| 같은 프로젝트는 네이버가 `openid`나 `email` 같은 범위 요청을 받지 않으므로 `profile` 범위만 쓰라고 안내한다. | 제3자 자료 | 같은 프로젝트 |

## 확인하지 못한 항목

| 항목 | 확인 방법 |
|---|---|
| 네이버 로그인을 모든 사용자에게 열려면 검수를 받아야 하는지와, 검수 전 개발 상태에서 로그인할 수 있는 사용자 범위 | 네이버 개발자센터의 네이버 로그인 문서와 애플리케이션 설정 화면을 확인한다 |
| 네이버가 주는 이메일을 확인된 이메일로 볼 수 있는지 | 네이버 개발자센터 문서와, 로컬 스택에서 받은 Supabase의 `auth.identities` 데이터를 확인한다 |
| 웹 앱의 중계 경로가 Supabase Auth 서버의 사용자 정보 요청을 받는 데 제한이 없는지 | 구현 Task에서 로컬 스택과 Vercel 미리보기로 확인한다 |

## 관련 문서

- [ADR-0015: Supabase Auth와 카카오·구글·네이버 로그인](../decisions/0015-auth-providers-with-naver.md)
- [ADR-0005: Supabase Auth와 카카오·구글 로그인](../decisions/0005-auth-supabase-social-login.md)
- [001 계정 요구사항](../specs/001-account/requirements.md)
- [스택 선택지 조사](2026-11-18-stack-options.md): 네이버 로그인 연결을 처음 조사한 기록
