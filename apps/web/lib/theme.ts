// 화면 모드(라이트, 다크, 시스템)를 정하는 규칙. F-UX-02, 헌법 P-12.
// 사용자가 고른 값(preference)은 브라우저 localStorage와 <html data-theme-preference>에 두고,
// 실제로 그릴 모드(theme)는 <html data-theme>에 둔다.

export const THEME_STORAGE_KEY = "hamtteukka-theme";
export const THEME_PREFERENCES = ["light", "dark", "system"] as const;
export const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";
/** 휴대폰 브라우저 주소창 색. globals.css의 --hm-canvas와 같은 값이다. */
export const THEME_COLORS = { light: "#faf6f0", dark: "#1c1917" } as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type Theme = keyof typeof THEME_COLORS;

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === "string" && (THEME_PREFERENCES as readonly string[]).includes(value);
}

/** 고른 값과 기기 설정으로 실제로 그릴 모드를 정한다. */
export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): Theme {
  if (preference === "system") return systemPrefersDark ? "dark" : "light";
  return preference;
}

/**
 * <html>에 모드를 반영한다. 브라우저 기본 UI(스크롤바, 폼)도 같은 모드로 그리도록 color-scheme을 바꾸고,
 * 직접 고른 모드가 기기 설정과 달라도 주소창 색이 화면을 따르도록 theme-color 메타 태그도 바꾼다.
 */
export function applyTheme(root: HTMLElement, preference: ThemePreference, systemPrefersDark: boolean): void {
  const theme = resolveTheme(preference, systemPrefersDark);
  root.dataset.theme = theme;
  root.dataset.themePreference = preference;
  root.style.colorScheme = theme;
  root.ownerDocument.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute("content", THEME_COLORS[theme]);
  });
}

/**
 * 첫 화면을 그리기 전에 <head>에서 실행하는 스크립트. 화면이 잠깐 밝게 깜빡이는 것을 막는다.
 * - 처음에는 localStorage의 값을 읽고, 읽을 수 없으면 시스템 모드로 본다.
 * - 기기 설정이 바뀌면 지금 페이지에서 고른 값(data-theme-preference)을 기준으로 다시 그린다.
 *   그래서 저장에 실패한 환경에서도 방금 고른 값이 예전 저장값에 덮이지 않는다.
 * - JavaScript가 꺼져 있으면 globals.css의 prefers-color-scheme 대체 규칙이 시스템 모드처럼 그린다.
 * - Next.js는 페이지를 이동할 때 <head>의 theme-color 태그를 viewport 기본값으로 다시 그린다.
 *   그래서 <head>를 지켜보다가 태그가 새로 생기거나 값이 바뀌면 지금 모드의 색으로 다시 맞춘다.
 *   이미 같은 값인 태그는 건드리지 않아야 이 감시가 자기 변경에 다시 반응하지 않는다.
 * applyTheme, resolveTheme과 같은 규칙이며 lib/theme.test.ts가 두 구현이 같은 결과를 내는지 확인한다.
 */
export const themeInitScript = `(function () {
  try {
    var root = document.documentElement;
    var media = window.matchMedia(${JSON.stringify(DARK_MEDIA_QUERY)});
    var colors = ${JSON.stringify(THEME_COLORS)};
    var valid = function (value) {
      return value === "light" || value === "dark" ? value : "system";
    };
    var syncThemeColor = function () {
      var color = colors[root.dataset.theme === "dark" ? "dark" : "light"];
      var metas = document.querySelectorAll('meta[name="theme-color"]');
      for (var i = 0; i < metas.length; i++) {
        if (metas[i].getAttribute("content") !== color) metas[i].setAttribute("content", color);
      }
    };
    var apply = function (preference) {
      var theme = preference === "system" ? (media.matches ? "dark" : "light") : preference;
      root.dataset.theme = theme;
      root.dataset.themePreference = preference;
      root.style.colorScheme = theme;
      syncThemeColor();
    };
    var stored = null;
    try {
      stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    } catch (error) {}
    apply(valid(stored));
    media.addEventListener("change", function () {
      apply(valid(root.dataset.themePreference));
    });
    if (typeof MutationObserver === "function") {
      new MutationObserver(syncThemeColor).observe(document.head, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["content"],
      });
    }
  } catch (error) {}
})();`;
