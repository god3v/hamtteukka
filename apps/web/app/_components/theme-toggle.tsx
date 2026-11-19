"use client";

import { useSyncExternalStore } from "react";

import {
  applyTheme,
  DARK_MEDIA_QUERY,
  isThemePreference,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "@/lib/theme";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "라이트" },
  { value: "dark", label: "다크" },
  { value: "system", label: "시스템" },
];

// 고른 값은 <html data-theme-preference>에 있다. <head>의 스크립트가 처음 값을 넣고, 버튼을 누르면 applyTheme이 바꾼다.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme-preference"] });
  return () => observer.disconnect();
}

function getPreference(): ThemePreference {
  const value = document.documentElement.dataset.themePreference;
  return isThemePreference(value) ? value : "system";
}

function getServerPreference(): ThemePreference {
  return "system";
}

function choose(next: ThemePreference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // 저장할 수 없는 환경(사생활 보호 모드 등)에서도 지금 화면에는 적용한다.
  }
  applyTheme(document.documentElement, next, window.matchMedia(DARK_MEDIA_QUERY).matches);
}

/**
 * 화면 모드를 고르는 라디오 버튼 묶음. 내 정보 화면의 설정 구역에 둔다.
 * 고른 항목은 강조 색이 아니라 선택된 필터 칩처럼 ink 바탕과 surface 글자로 그린다(docs/design/visual-system.md).
 */
export function ThemeToggle() {
  const preference = useSyncExternalStore(subscribe, getPreference, getServerPreference);

  return (
    <fieldset className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
      <legend className="sr-only">화면 모드</legend>
      <span aria-hidden="true">화면 모드</span>
      <div className="inline-flex rounded-full border border-line p-0.5">
        {OPTIONS.map((option) => (
          <label
            key={option.value}
            className="inline-flex min-h-11 min-w-14 cursor-pointer items-center justify-center rounded-full px-3 text-label text-secondary has-checked:bg-ink has-checked:text-surface has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus"
          >
            <input
              type="radio"
              name="theme"
              value={option.value}
              checked={preference === option.value}
              onChange={() => choose(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
