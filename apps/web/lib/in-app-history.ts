// 이 탭에서 앱 안의 다른 화면으로 옮긴 적이 있는지 기록한다.
// 퀵 카운터 화면의 닫기 버튼은 돌아갈 앱 화면이 있으면 뒤로 가고, 주소로 바로 들어왔으면 로그아웃 홈으로 간다
// (docs/specs/003-row-counter/design/screens.md).

export type InAppHistory = {
  record(pathname: string): void;
  canGoBack(): boolean;
};

export function createInAppHistory(): InAppHistory {
  let current: string | undefined;
  let moved = false;
  return {
    record(pathname) {
      if (current !== undefined && current !== pathname) moved = true;
      current = pathname;
    },
    canGoBack: () => moved,
  };
}

/**
 * 열기 전 화면으로 돌아갈 때 뒤로 갈 기록 수. 이 기록은 경로만 보므로 같은 화면의 해시 기록은 따로 센다.
 * 퀵 카운터 화면에서 '본문으로 건너뛰기'(#main)를 누르면 같은 화면의 해시 기록이 하나 더 생긴다.
 * 같은 해시로 다시 이동하면 기록이 늘지 않으므로, 해시가 있으면 그 기록까지 두 단계를 뒤로 간다.
 */
export function stepsBack(hash: string): number {
  return hash ? 2 : 1;
}

/** 이 탭의 기록. 새로 고침하면 처음부터 다시 기록한다. */
export const inAppHistory = createInAppHistory();
