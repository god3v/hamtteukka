// 퀵 카운터 브라우저 저장소를 확인한다. Node 내장 테스트 러너로 실행한다: node --test
import assert from "node:assert/strict";
import { test } from "node:test";

import { increment, reset, undoReset, type CounterValueDto } from "@hamtteukka/shared";

import {
  COUNTER_SETTINGS_KEY,
  createQuickCounterStore,
  QUICK_COUNTER_KEY,
  type QuickCounterChange,
  type QuickCounterStoreEnv,
} from "./quick-counter-store.ts";

const T1 = "2026-11-23T10:00:00.000Z";
const T2 = "2026-11-23T10:05:00.000Z";

// 같은 브라우저의 localStorage를 흉내 낸다. env()를 부를 때마다 탭 하나가 생기고, deliver로 그 탭에만 변경 알림을 보낸다.
function fakeBrowser() {
  const items = new Map<string, string>();
  const flags = { failReads: false, failWrites: false, writes: 0 };
  const tabs: Array<Set<(key: string | null) => void>> = [];
  const storage = {
    getItem: (key: string) => {
      if (flags.failReads) throw new Error("SecurityError");
      return items.get(key) ?? null;
    },
    setItem: (key: string, value: string) => {
      if (flags.failWrites) throw new Error("QuotaExceededError");
      flags.writes += 1;
      items.set(key, value);
    },
    removeItem: (key: string) => {
      items.delete(key);
    },
  };
  const env = (): QuickCounterStoreEnv => {
    const listeners = new Set<(key: string | null) => void>();
    tabs.push(listeners);
    return {
      getStorage: () => storage,
      subscribeStorage: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    };
  };
  const deliver = (tab: number, key: string | null) => tabs[tab]?.forEach((listener) => listener(key));
  const stored = (): CounterValueDto | undefined => {
    const raw = items.get(QUICK_COUNTER_KEY);
    return raw === undefined ? undefined : (JSON.parse(raw) as CounterValueDto);
  };
  return { items, flags, env, deliver, stored };
}

function blockedEnv(): QuickCounterStoreEnv {
  return {
    getStorage: () => {
      throw new Error("SecurityError");
    },
  };
}

function countTo(store: ReturnType<typeof createQuickCounterStore>, times: number, now = T1) {
  for (let i = 0; i < times; i++) store.update((value) => increment(value, now));
}

test("003/AC-14 센 값과 마지막으로 센 시각을 브라우저 저장소에 남기고, 다시 열면 그대로 읽는다", () => {
  const browser = fakeBrowser();
  const first = createQuickCounterStore(browser.env());

  countTo(first, 7);
  const reopened = createQuickCounterStore(browser.env());

  assert.deepEqual(browser.stored(), { total: 7, setSize: null, lastCountedAt: T1 });
  assert.deepEqual(reopened.getSnapshot().value, { total: 7, setSize: null, lastCountedAt: T1 });
  assert.equal(reopened.getSnapshot().mode, "PERSISTENT");
});

test("003/AC-17 저장소에 접근할 수 없으면 MEMORY_ONLY로 시작하고 화면을 연 동안만 값을 유지한다", () => {
  const store = createQuickCounterStore(blockedEnv());

  countTo(store, 3);
  const reloaded = createQuickCounterStore(blockedEnv());

  assert.equal(store.getSnapshot().mode, "MEMORY_ONLY");
  assert.equal(store.getSnapshot().value.total, 3);
  assert.equal(reloaded.getSnapshot().value.total, 0);
});

test("003/AC-17 처음에는 저장소를 썼더라도 쓰기에서 예외가 나면 화면 값을 이어서 MEMORY_ONLY로 바꾼다", () => {
  const browser = fakeBrowser();
  const store = createQuickCounterStore(browser.env());
  countTo(store, 2);

  browser.flags.failWrites = true;
  countTo(store, 1);
  countTo(store, 1);

  assert.equal(store.getSnapshot().mode, "MEMORY_ONLY");
  assert.equal(store.getSnapshot().value.total, 4);
  assert.equal(browser.stored()?.total, 2);
});

test("003/AC-17 읽기에서 예외가 나도 화면 값을 이어서 MEMORY_ONLY로 바꾼다", () => {
  const browser = fakeBrowser();
  const store = createQuickCounterStore(browser.env());
  countTo(store, 2);

  browser.flags.failReads = true;
  countTo(store, 1);

  assert.equal(store.getSnapshot().mode, "MEMORY_ONLY");
  assert.equal(store.getSnapshot().value.total, 3);
});

test("탭을 오가며 센 조작은 저장소의 최신 값에 더해 덮어쓰지 않는다", () => {
  const browser = fakeBrowser();
  const tabA = createQuickCounterStore(browser.env());
  const tabB = createQuickCounterStore(browser.env());

  countTo(tabA, 5);
  countTo(tabB, 1);

  assert.equal(browser.stored()?.total, 6);
  assert.equal(tabB.getSnapshot().value.total, 6);
});

test("다른 탭의 변경 알림을 받으면 저장소의 현재 값을 다시 읽어 external로 알린다", () => {
  const browser = fakeBrowser();
  const tabA = createQuickCounterStore(browser.env());
  const tabB = createQuickCounterStore(browser.env());
  const changes: QuickCounterChange[] = [];
  tabB.subscribe((change) => changes.push(change));

  countTo(tabA, 1);
  countTo(tabA, 1);
  browser.deliver(1, QUICK_COUNTER_KEY);

  assert.equal(tabB.getSnapshot().value.total, 2);
  assert.deepEqual(changes, ["external"]);
});

test("MEMORY_ONLY인 탭은 다른 탭의 변경 알림을 무시한다", () => {
  const browser = fakeBrowser();
  const tabA = createQuickCounterStore(browser.env());
  const tabB = createQuickCounterStore(browser.env());
  browser.flags.failWrites = true;
  countTo(tabB, 10);
  browser.flags.failWrites = false;
  const changes: QuickCounterChange[] = [];
  tabB.subscribe((change) => changes.push(change));

  countTo(tabA, 1);
  browser.deliver(1, QUICK_COUNTER_KEY);

  assert.equal(tabB.getSnapshot().mode, "MEMORY_ONLY");
  assert.equal(tabB.getSnapshot().value.total, 10);
  assert.deepEqual(changes, []);
});

test("형식이 맞지 않는 저장 값은 전체 단수 0으로 시작한다", () => {
  const browser = fakeBrowser();
  browser.items.set(QUICK_COUNTER_KEY, "{ broken");
  browser.items.set(COUNTER_SETTINGS_KEY, "[1]");

  const store = createQuickCounterStore(browser.env());

  assert.deepEqual(store.getSnapshot().value, { total: 0, setSize: null, lastCountedAt: null });
  assert.deepEqual(store.getSnapshot().settings, { sound: false, vibration: false, keepScreenOn: false });
});

test("값이 바뀌지 않는 조작은 저장하지도 알리지도 않는다", () => {
  const browser = fakeBrowser();
  const store = createQuickCounterStore(browser.env());
  const writesBefore = browser.flags.writes;
  const changes: QuickCounterChange[] = [];
  store.subscribe((change) => changes.push(change));

  store.update((value) => value);

  assert.equal(browser.flags.writes, writesBefore);
  assert.deepEqual(changes, []);
});

test("실패한 조작은 저장하지 않고, 저장소의 현재 값을 화면에 보여 준다", () => {
  const browser = fakeBrowser();
  const tabA = createQuickCounterStore(browser.env());
  const tabB = createQuickCounterStore(browser.env());
  countTo(tabA, 40);
  let undo: ReturnType<typeof reset>["undo"] | undefined;
  tabA.update((value) => {
    const result = reset(value, T1);
    undo = result.undo;
    return result.value;
  });

  countTo(tabB, 1, T2);
  const result = tabA.tryUpdate((latest) => undoReset(latest, undo!, T2));

  assert.deepEqual(result, { ok: false, error: "UNDO_EXPIRED" });
  assert.equal(browser.stored()?.total, 1);
  assert.equal(tabA.getSnapshot().value.total, 1);
});

test("003/AC-09 바꾼 피드백 설정은 같은 브라우저에서 다시 열어도 유지된다", () => {
  const browser = fakeBrowser();
  const store = createQuickCounterStore(browser.env());

  store.updateSettings({ sound: true });
  const reopened = createQuickCounterStore(browser.env());

  assert.deepEqual(reopened.getSnapshot().settings, { sound: true, vibration: false, keepScreenOn: false });
});

test("구독을 끊거나 저장소를 정리하면 더 알리지 않는다", () => {
  const browser = fakeBrowser();
  const tabA = createQuickCounterStore(browser.env());
  const tabB = createQuickCounterStore(browser.env());
  const changes: QuickCounterChange[] = [];
  const unsubscribe = tabB.subscribe((change) => changes.push(change));

  unsubscribe();
  countTo(tabB, 1);
  tabB.subscribe((change) => changes.push(change));
  tabB.dispose();
  countTo(tabA, 1);
  browser.deliver(1, QUICK_COUNTER_KEY);

  assert.deepEqual(changes, []);
});
