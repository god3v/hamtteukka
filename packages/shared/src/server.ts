// 서버에서만 실행하는 계정 작업 함수(docs/specs/001-account/design/domain.md의 accountServerJobs)를 내보내는 진입점이다.
// 앱은 `@hamtteukka/shared/server`로 import한다. 이 진입점의 함수는 RLS를 거치지 않는 secret 키를 쓰므로,
// 클라이언트 컴포넌트가 import하면 Next.js 빌드가 실패하도록 server-only를 둔다 (헌법 P-10).
// 함수는 로그인 기록(#92), 탈퇴 처리(#99), 메일 발송(#103) Task에서 더한다.
import "server-only";

export {};
