// 화면 모드 규칙과 <head> 스크립트를 확인한다. Node 내장 테스트 러너로 실행한다: node --test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

type FakeMeta = {
  name: string;
  content: string;
  getAttribute: (name: string) => string | null;
  setAttribute: (name: string, value: string) => void;
};
type FakeRoot = { dataset: Record<string, string>; style: { colorScheme?: string }; ownerDocument: unknown };

function fakeMeta(name: string, content: string): FakeMeta {
  const meta: FakeMeta = {
    name,
    content,
    getAttribute: (attribute) => (attribute === "content" ? meta.content : null),
    setAttribute: (attribute, value) => {
      if (attribute === "content") meta.content = value;
    },
  };
  return meta;
}

// theme-color 태그 두 개와, 바뀌면 안 되는 description 태그 하나를 둔다.
function fakeMetas(): FakeMeta[] {
  return [
    fakeMeta("theme-color", THEME_COLORS.light),
    fakeMeta("theme-color", THEME_COLORS.dark),
    fakeMeta("description", "함뜨까"),
  ];
}

// 실제 문서처럼 선택자에 맞는 태그만 돌려준다. 선택자 이름이 틀리면 아무 태그도 돌려주지 않는다.
function fakeQuerySelectorAll(metas: FakeMeta[]) {
  return (selector: string) => {
    const match = /^meta\[name="([^"]+)"\]$/.exec(selector);
    if (!match) throw new Error(`테스트가 지원하지 않는 선택자: ${selector}`);
    return metas.filter((meta) => meta.name === match[1]);
  };
}

function fakeRoot(metas: FakeMeta[]): FakeRoot {
  return { dataset: {}, style: {}, ownerDocument: { querySelectorAll: fakeQuerySelectorAll(metas) } };
}

// 브라우저 대신 쓰는 가짜 환경. 저장된 값, 기기의 다크 설정, localStorage 사용 가능 여부를 바꿔 가며 스크립트를 실행한다.
function runInitScript(options: { stored?: string | null; systemDark?: boolean; storageThrows?: boolean }) {
  const metas = fakeMetas();
  const root = fakeRoot(metas);
  const listeners: Array<() => void> = [];
  const media = { matches: options.systemDark ?? false, addEventListener: (_: string, fn: () => void) => listeners.push(fn) };
  const store = new Map<string, string>();
  if (options.stored != null) store.set(THEME_STORAGE_KEY, options.stored);
  const head = {};
  // 스크립트가 <head>를 지켜보는지 확인하려고, 감시 대상과 조건을 기록하는 가짜 MutationObserver를 둔다.
  const observers: Array<{ target: unknown; options: unknown; callback: () => void }> = [];
  class FakeMutationObserver {
    callback: () => void;
    constructor(callback: () => void) {
      this.callback = callback;
    }
    observe(target: unknown, observeOptions: unknown) {
      observers.push({ target, options: observeOptions, callback: this.callback });
    }
  }
  const context = {
    document: { documentElement: root, head, querySelectorAll: fakeQuerySelectorAll(metas) },
    window: { matchMedia: () => media },
    MutationObserver: FakeMutationObserver,
    localStorage: {
      getItem: (key: string) => {
        if (options.storageThrows) throw new Error("SecurityError");
        return store.get(key) ?? null;
      },
    },
  };
  vm.runInNewContext(themeInitScript, context);
  return {
    root,
    metas,
    media,
    head,
    observers,
    fireSystemChange: () => listeners.forEach((fn) => fn()),
    fireHeadChange: () => observers.forEach((observer) => observer.callback()),
  };
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

test("주소창 색(theme-color)도 실제로 그리는 모드를 따르고, 다른 메타 태그는 바꾸지 않는다", () => {
  const expected = [THEME_COLORS.dark, THEME_COLORS.dark, "함뜨까"];

  const fromScript = runInitScript({ stored: "dark", systemDark: false });
  assert.deepEqual(
    fromScript.metas.map((meta) => meta.content),
    expected,
  );

  const metas = fakeMetas();
  applyTheme(fakeRoot(metas) as unknown as HTMLElement, "dark", false);
  assert.deepEqual(
    metas.map((meta) => meta.content),
    expected,
  );
});

test("페이지 이동 뒤 주소창 색 태그가 기본값으로 다시 그려져도 고른 모드의 색으로 되돌린다", () => {
  // 기기는 라이트, 사용자는 다크를 고른 상태
  const env = runInitScript({ stored: "dark", systemDark: false });
  assert.equal(env.observers.length, 1);
  assert.equal(env.observers[0]?.target, env.head);

  // Next.js가 페이지를 이동하며 viewport 태그를 기본값으로 바꾸고, 같은 태그를 하나 더 만든 상황
  const lightMeta = env.metas[0];
  assert.ok(lightMeta);
  lightMeta.content = THEME_COLORS.light;
  env.metas.splice(2, 0, fakeMeta("theme-color", THEME_COLORS.light));
  env.fireHeadChange();

  assert.deepEqual(
    env.metas.map((meta) => meta.content),
    [THEME_COLORS.dark, THEME_COLORS.dark, THEME_COLORS.dark, "함뜨까"],
  );
});

test("주소창 색을 다시 맞출 때 이미 같은 값인 태그는 건드리지 않는다", () => {
  // 값을 바꿀 때마다 MutationObserver가 다시 불리므로, 같은 값을 다시 쓰면 무한히 반복된다.
  const env = runInitScript({ stored: "dark", systemDark: false });
  let writes = 0;
  for (const meta of env.metas) {
    const original = meta.setAttribute;
    meta.setAttribute = (attribute, value) => {
      writes += 1;
      original(attribute, value);
    };
  }
  env.fireHeadChange();
  assert.equal(writes, 0);
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

// globals.css에서 선택자 블록 하나의 --hm-* 토큰을 읽는다. 토큰 블록에는 중괄호가 중첩되지 않는다.
const globalsCss = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

function readTokens(selector: string): Map<string, string> {
  const start = globalsCss.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `globals.css에 ${selector} 블록이 없다`);
  const block = globalsCss.slice(start, globalsCss.indexOf("}", start));
  return new Map(
    [...block.matchAll(/(--hm-[a-z-]+):\s*([^;]+);/g)].map(([, name = "", value = ""]) => [name, value.trim()]),
  );
}

test("라이트와 다크 토큰은 같은 이름을 모두 정의한다", () => {
  const light = readTokens(":root");
  const dark = readTokens('[data-theme="dark"]');
  assert.ok(light.size > 0);
  assert.deepEqual([...dark.keys()].sort(), [...light.keys()].sort());
});

test("JavaScript가 꺼진 환경의 다크 대체 토큰은 data-theme 다크 토큰과 같다", () => {
  assert.deepEqual(readTokens(":root:not([data-theme])"), readTokens('[data-theme="dark"]'));
});

test("주소창 색은 globals.css의 surface 토큰과 같다", () => {
  assert.equal(readTokens(":root").get("--hm-surface"), THEME_COLORS.light);
  assert.equal(readTokens('[data-theme="dark"]').get("--hm-surface"), THEME_COLORS.dark);
});

test("resolveTheme과 isThemePreference는 정한 값만 받아들인다", () => {
  assert.equal(resolveTheme("system", true), "dark");
  assert.equal(resolveTheme("dark", false), "dark");
  assert.equal(isThemePreference("system"), true);
  assert.equal(isThemePreference("auto"), false);
  assert.equal(isThemePreference(undefined), false);
});
