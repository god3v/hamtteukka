// 화면 모드 규칙과 <head> 스크립트를 확인한다. Node 내장 테스트 러너로 실행한다: node --test
import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";

import {
  applyTheme,
  isThemePreference,
  resolveTheme,
  THEME_COLORS,
  THEME_STORAGE_KEY,
  themeInitScript,
  type ThemePreference,
} from "./theme.ts";

type FakeMeta = { content: string; setAttribute: (name: string, value: string) => void };
type FakeRoot = { dataset: Record<string, string>; style: { colorScheme?: string }; ownerDocument: unknown };

function fakeMetas(): FakeMeta[] {
  return [THEME_COLORS.light, THEME_COLORS.dark].map((content) => {
    const meta: FakeMeta = { content, setAttribute: (_name, value) => (meta.content = value) };
    return meta;
  });
}

function fakeRoot(metas: FakeMeta[]): FakeRoot {
  return { dataset: {}, style: {}, ownerDocument: { querySelectorAll: () => metas } };
}

// 브라우저 대신 쓰는 가짜 환경. 저장된 값, 기기의 다크 설정, localStorage 사용 가능 여부를 바꿔 가며 스크립트를 실행한다.
function runInitScript(options: { stored?: string | null; systemDark?: boolean; storageThrows?: boolean }) {
  const metas = fakeMetas();
  const root = fakeRoot(metas);
  const listeners: Array<() => void> = [];
  const media = { matches: options.systemDark ?? false, addEventListener: (_: string, fn: () => void) => listeners.push(fn) };
  const store = new Map<string, string>();
  if (options.stored != null) store.set(THEME_STORAGE_KEY, options.stored);
  const context = {
    document: { documentElement: root, querySelectorAll: () => metas },
    window: { matchMedia: () => media },
    localStorage: {
      getItem: (key: string) => {
        if (options.storageThrows) throw new Error("SecurityError");
        return store.get(key) ?? null;
      },
    },
  };
  vm.runInNewContext(themeInitScript, context);
  return { root, metas, media, fireSystemChange: () => listeners.forEach((fn) => fn()) };
}

function snapshot(root: FakeRoot, metas: FakeMeta[]) {
  return { dataset: root.dataset, colorScheme: root.style.colorScheme, metas: metas.map((meta) => meta.content) };
}

test("저장한 값이 없으면 기기 설정을 따른다", () => {
  assert.equal(runInitScript({ systemDark: false }).root.dataset.theme, "light");
  const dark = runInitScript({ systemDark: true }).root;
  assert.equal(dark.dataset.theme, "dark");
  assert.equal(dark.dataset.themePreference, "system");
  assert.equal(dark.style.colorScheme, "dark");
});

test("라이트나 다크를 저장했으면 기기 설정과 상관없이 그 모드로 그린다", () => {
  assert.equal(runInitScript({ stored: "dark", systemDark: false }).root.dataset.theme, "dark");
  assert.equal(runInitScript({ stored: "light", systemDark: true }).root.dataset.theme, "light");
});

test("저장한 값이 올바르지 않으면 시스템 모드로 본다", () => {
  const { root } = runInitScript({ stored: "blue", systemDark: true });
  assert.equal(root.dataset.themePreference, "system");
  assert.equal(root.dataset.theme, "dark");
});

test("주소창 색(theme-color)도 실제로 그리는 모드를 따른다", () => {
  const { metas } = runInitScript({ stored: "dark", systemDark: false });
  assert.deepEqual(
    metas.map((meta) => meta.content),
    [THEME_COLORS.dark, THEME_COLORS.dark],
  );
});

test("시스템 모드에서는 기기 설정이 바뀌면 따라가고, 고정한 모드는 따라가지 않는다", () => {
  const system = runInitScript({ systemDark: false });
  system.media.matches = true;
  system.fireSystemChange();
  assert.equal(system.root.dataset.theme, "dark");

  const fixed = runInitScript({ stored: "light", systemDark: false });
  fixed.media.matches = true;
  fixed.fireSystemChange();
  assert.equal(fixed.root.dataset.theme, "light");
});

test("기기 설정이 바뀌면 저장값이 아니라 지금 페이지에서 고른 값을 기준으로 다시 그린다", () => {
  // 저장에 실패해 localStorage에는 예전 값(light)이 남았지만, 페이지에서는 시스템을 고른 경우
  const env = runInitScript({ stored: "light", systemDark: false });
  applyTheme(env.root as unknown as HTMLElement, "system", false);
  env.media.matches = true;
  env.fireSystemChange();
  assert.equal(env.root.dataset.themePreference, "system");
  assert.equal(env.root.dataset.theme, "dark");
});

test("localStorage를 쓸 수 없어도 시스템 모드로 그리고 기기 설정 변화를 따라간다", () => {
  const env = runInitScript({ storageThrows: true, systemDark: false });
  assert.equal(env.root.dataset.theme, "light");
  env.media.matches = true;
  env.fireSystemChange();
  assert.equal(env.root.dataset.theme, "dark");
});

test("스크립트와 applyTheme은 모든 경우에 같은 결과를 낸다", () => {
  const preferences: ThemePreference[] = ["light", "dark", "system"];
  for (const preference of preferences) {
    for (const systemDark of [false, true]) {
      const fromScript = runInitScript({ stored: preference, systemDark });
      const metas = fakeMetas();
      const root = fakeRoot(metas);
      applyTheme(root as unknown as HTMLElement, preference, systemDark);
      assert.deepEqual(
        snapshot(fromScript.root, fromScript.metas),
        snapshot(root, metas),
        `${preference}, 기기 다크=${systemDark}`,
      );
    }
  }
});

test("resolveTheme과 isThemePreference는 정한 값만 받아들인다", () => {
  assert.equal(resolveTheme("system", true), "dark");
  assert.equal(resolveTheme("dark", false), "dark");
  assert.equal(isThemePreference("system"), true);
  assert.equal(isThemePreference("auto"), false);
  assert.equal(isThemePreference(undefined), false);
});
