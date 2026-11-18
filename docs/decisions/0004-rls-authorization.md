---
doc_type: explanation
status: accepted
updated: 2026-11-18
decided: 2026-11-18
---

# ADR-0004: RLS를 1차 권한 검사로 사용

이 문서는 브라우저와 앱이 Supabase를 직접 호출하는 동안 Postgres의 행 수준 보안(RLS)을 1차 권한 검사로 쓰기로 한 결정을 설명한다. 독자는 권한 규칙을 어디에 쓰고 어디에 기록하는지, 나중에 Spring 서버로 권한 검사를 옮길 때 무엇을 근거로 삼는지 알 수 있다.

## 상태

| 항목 | 내용 |
|---|---|
| 상태 | 확정 (accepted) |
| 결정일 | 2026-11-18 |
| 결정자 | 프로젝트 소유자 |
| 이 ADR이 대신하는 이전 ADR | 없음 |
| 이 ADR을 대신하는 새 ADR | 없음 |

## 맥락

[ADR-0003](0003-data-access-boundary.md)에 따라 브라우저와 앱은 `packages/shared` 함수를 거쳐 Supabase를 직접 호출한다. 이 경로의 요청은 함뜨까가 운영하는 서버 코드를 거치지 않는다. 따라서 서버 코드에서만 권한을 검사하면 직접 호출 경로가 보호되지 않는다.

Supabase는 웹과 Expo 앱이 같은 RLS 정책을 공유하는 구성을 안내한다. 이 구성에서는 권한 로직을 DB에 한 번만 쓰면 된다([Supabase Expo 가이드](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native)). 반대로 RLS를 쓰지 않으면 모든 권한 검사를 서버 코드에 직접 써야 하므로, 1인 개발에서 권한 검사를 빠뜨릴 위험이 커진다(추정, [스택 조사](../research/2026-11-18-stack-options.md)).

R4에서는 Spring 서버를 추가한다([ADR-0001](0001-monorepo-structure.md)). 어떤 기능의 접근 경로가 Spring으로 옮겨 가면 RLS 정책과 같은 규칙을 Spring 코드로 다시 구현해야 하므로, 정책 내용을 SQL 밖에서도 읽을 수 있게 남겨 두어야 했다.

## 결정

- 브라우저와 앱이 Supabase를 직접 호출하는 동안 RLS를 1차 권한 검사로 쓴다.
- 브라우저나 앱이 읽거나 쓰는 테이블에는 모두 RLS를 켜고 정책을 정의한다.
- Server Actions나 shared 함수에서 입력 검증과 추가 검사를 할 수 있다. 그러나 그 검사가 RLS 정책을 대신하지 않는다.
- 모든 RLS 정책은 해당 기능의 `docs/specs/NNN-name/design/erd.md`에 있는 RLS 정책 표에 기록한다. 표에는 어떤 테이블의 어떤 작업을 누구에게 어떤 조건으로 허용하는지 적는다.
- 정책을 추가하거나 바꾸는 변경은 SDD 절차를 따른다. 정책 표를 먼저 고치고, 그 표를 근거로 정책 SQL을 고친다.
- 어떤 기능의 접근 경로가 Spring 서버로 옮겨 가면, 그 기능의 정책 표를 기준으로 Spring에 같은 규칙을 구현한다.

## 검토한 대안

### 서버 코드에서만 권한을 검사한다

브라우저와 앱이 DB에 직접 접근하지 못하게 막고, 모든 요청을 서버 코드로 받아 권한을 검사하는 방안이다. 권한 로직이 애플리케이션 언어 하나에 모이고, 나중에 Spring으로 옮기기도 쉽다.

그러나 이 방안을 쓰면 모든 기능에 서버 엔드포인트를 만들어야 한다. 이는 [ADR-0003](0003-data-access-boundary.md)에서 채택하지 않은 HTTP API 우선 방식과 같은 비용을 만든다. 또한 기능마다 서버 코드에 권한 검사를 직접 넣어야 하므로, 한 곳만 빠뜨려도 다른 회원의 데이터가 노출된다.

Spring으로 옮기기 쉽다는 장점은 정책 표를 기록하는 규칙으로 일부 보완한다. 그래서 이 방안은 채택하지 않았다.

## 결과

### 좋은 점

- 웹과 앱이 같은 권한 규칙을 쓰고, 그 규칙은 DB 한 곳에 있다.
- 화면 코드에 버그가 있어도 권한이 없는 행은 조회 결과에 나오지 않는다.
- 정책 표가 있으므로 SQL을 읽지 않아도 기능별 권한 규칙을 검토할 수 있다.

### 감수할 점

- 정책이 의도대로 동작하는지 확인하는 테스트를 따로 작성해야 한다.
- 조건이 복잡한 권한 규칙은 SQL 정책으로 표현하기 어렵다.
- RLS 정책은 Supabase Auth가 발급한 사용자 정보에 묶이므로, 인증 시스템을 바꾸면 정책도 다시 써야 한다(추정, [스택 조사](../research/2026-11-18-stack-options.md)).
- 정책 SQL과 정책 표가 어긋날 수 있다. `/sdd-verify` 단계에서 두 내용을 대조한다.

## 관련 문서

- [SDD 진행 가이드](../sdd-guide.md): 권한 규칙을 바꿀 때 따르는 절차
- [전체 ERD](../architecture/erd-overview.md): 테이블 전체 구성
- [설계 템플릿: erd.md](../specs/_template/design/erd.md): RLS 정책 표의 형식
- [ADR-0003: Supabase 접근을 packages/shared로 제한](0003-data-access-boundary.md)
- [ADR-0005: Supabase Auth와 카카오·구글 로그인](0005-auth-supabase-social-login.md)
