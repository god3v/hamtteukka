// 퀵 카운터 화면의 조작과 리셋·되돌리기 상태를 확인한다. Node 내장 테스트 러너로 실행한다: node --test
import assert from "node:assert/strict";
import { test } from "node:test";

import { createQuickCounterController, storageNotice } from "./quick-counter-controller.ts";
import { createQuickCounterStore, QUICK_COUNTER_KEY, type QuickCounterStoreEnv } from "./quick-counter-store.ts";

const T = "2026-11-23T10:00:00.000Z";

// 같은 브라우저의 localStorage. env()를 부를 때마다 탭 하나가 생긴다.
function fakeBrowser() {
  const items = new Map<string, string>();
  const tabs: Array<Set<(key: string | null) => void>> = [];
  const storage = {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
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
  const deliver = (tab: number) => tabs[tab]?.forEach((listener) => listener(QUICK_COUNTER_KEY));
  return { env, deliver };
}

function setup(start = 0) {
  const browser = fakeBrowser();
  const store = createQuickCounterStore(browser.env());
  const controller = createQuickCounterController(store, () => T);
  for (let i = 0; i < start; i++) controller.increment();
  return { browser, store, controller, total: () => store.getSnapshot().value.total };
}

test("003/AC-03 값이 0일 때 빼기를 눌러도 값은 0으로 남는다", () => {
  const { controller, total } = setup(0);

  controller.decrement();

  assert.equal(total(), 0);
});

test("003/AC-04 리셋 확인 창에서 취소하면 값이 그대로 남는다", () => {
  const { controller, total } = setup(40);

  controller.requestReset();
  assert.equal(controller.getPhase().kind, "confirming");
  controller.cancelReset();

  assert.equal(total(), 40);
  assert.equal(controller.getPhase().kind, "counting");
});

test("003/AC-05 리셋을 확인하면 값이 0이 되고 되돌리기 버튼이 보인다", () => {
  const { controller, total } = setup(40);

  controller.requestReset();
  controller.confirmReset();

  assert.equal(total(), 0);
  assert.equal(controller.getPhase().kind, "undo");
});

test("003/AC-06 되돌리기를 누르면 리셋 전 값으로 돌아간다", () => {
  const { controller, total } = setup(40);
  controller.requestReset();
  controller.confirmReset();

  const result = controller.undoReset();

  assert.deepEqual(result, { ok: true, value: { total: 40, setSize: null, lastCountedAt: T } });
  assert.equal(total(), 40);
  assert.equal(controller.getPhase().kind, "counting");
});

test("003/AC-07 리셋 뒤 더하기를 누르면 1이 되고 되돌리기 버튼이 사라진다", () => {
  const { controller, total } = setup(40);
  controller.requestReset();
  controller.confirmReset();

  controller.increment();

  assert.equal(total(), 1);
  assert.equal(controller.getPhase().kind, "counting");
});

test("003/AC-10 더하기를 빠르게 5번 누르면 누른 횟수만큼 반영한다", () => {
  const { controller, total } = setup(10);

  for (let i = 0; i < 5; i++) controller.increment();

  assert.equal(total(), 15);
});

test("되돌리기 버튼이 보이는 동안 다른 탭에서 값이 바뀌면 되돌리기 정보를 버린다", () => {
  const { browser, controller } = setup(40);
  const otherTab = createQuickCounterStore(browser.env());
  controller.subscribe(() => {});
  controller.requestReset();
  controller.confirmReset();

  otherTab.update((value) => ({ ...value, total: value.total + 1, lastCountedAt: T }));
  browser.deliver(0);

  assert.equal(controller.getPhase().kind, "counting");
});

test("다른 탭의 변경이 알림보다 먼저 저장됐으면 되돌리기는 UNDO_EXPIRED로 끝나고 값을 덮어쓰지 않는다", () => {
  const { browser, controller, total } = setup(40);
  const otherTab = createQuickCounterStore(browser.env());
  controller.requestReset();
  controller.confirmReset();
  otherTab.update((value) => ({ ...value, total: value.total + 1, lastCountedAt: "2026-11-23T10:01:00.000Z" }));

  const result = controller.undoReset();

  assert.deepEqual(result, { ok: false, error: "UNDO_EXPIRED" });
  assert.equal(total(), 1);
  assert.equal(controller.getPhase().kind, "counting");
});

test("상태가 바뀔 때만 구독자에게 알린다", () => {
  const { controller } = setup(3);
  let calls = 0;
  controller.subscribe(() => (calls += 1));

  controller.increment();
  controller.requestReset();
  controller.requestReset();

  assert.equal(calls, 1);
});

test("003/AC-37 저장 방식에 맞는 저장 안내를 보여 준다", () => {
  assert.equal(storageNotice("PERSISTENT"), "이 브라우저에만 저장돼요. 브라우저 데이터를 지우면 사라져요.");
});

test("003/AC-17 저장소를 쓸 수 없으면 탭을 닫으면 값이 사라진다고 안내한다", () => {
  assert.equal(storageNotice("MEMORY_ONLY"), "탭을 닫거나 새로 고침하면 값이 사라져요.");
});

test("화면이 구독을 모두 끊으면 저장소 구독도 끊는다", () => {
  const { browser, controller } = setup(40);
  const otherTab = createQuickCounterStore(browser.env());
  const unsubscribe = controller.subscribe(() => {});
  controller.requestReset();
  controller.confirmReset();

  unsubscribe();
  otherTab.update((value) => ({ ...value, total: value.total + 1, lastCountedAt: T }));
  browser.deliver(0);

  assert.equal(controller.getPhase().kind, "undo");
});
