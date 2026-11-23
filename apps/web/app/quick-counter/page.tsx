import type { Metadata } from "next";

import { QuickCounterScreen } from "./quick-counter-screen";

export const metadata: Metadata = {
  title: "퀵 카운터",
};

// 로그인 없이 쓰는 퀵 카운터 화면. 화면 전체 높이의 바텀 시트로 열고, 값은 이 브라우저에만 저장한다.
// 배치는 docs/design/r1-screens.md의 카운터 화면 절, 동작은 docs/specs/003-row-counter/design/state.md를 따른다.
export default function QuickCounterPage() {
  return <QuickCounterScreen />;
}
