// 하단 탭 구성과 활성 탭 규칙. docs/design/information-architecture.md의 하단 탭 절을 따른다.
// 탭은 그 문서의 순서(홈, 프로젝트, 도안, 커뮤니티, 내 정보)로 두고, 아직 출시하지 않은 탭은 넣지 않는다.

export type BottomTab = {
  id: "home" | "me";
  label: string;
  /** 탭의 첫 화면. 활성 탭을 다시 누르면 이 화면으로 돌아간다. */
  href: string;
  /** 이 탭에 속한 화면의 경로. 하위 경로(/me/...)도 이 탭에 속한다. */
  paths: readonly string[];
};

// R0에는 홈과 내 정보 탭만 보인다. 고객 지원 화면은 내 정보 탭 아래에 있다.
export const BOTTOM_TABS: readonly BottomTab[] = [
  { id: "home", label: "홈", href: "/", paths: ["/"] },
  { id: "me", label: "내 정보", href: "/me", paths: ["/me", "/support"] },
];

function matchesPath(pathname: string, path: string): boolean {
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}

/** 지금 보고 있는 화면이 속한 탭. 어느 탭에도 속하지 않으면 undefined다. */
export function findActiveTab(pathname: string): BottomTab | undefined {
  return BOTTOM_TABS.find((tab) => tab.paths.some((path) => matchesPath(pathname, path)));
}
