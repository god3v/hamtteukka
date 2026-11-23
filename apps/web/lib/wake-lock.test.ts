// 화면 꺼짐 방지 모듈을 확인한다. Node 내장 테스트 러너로 실행한다: node --test
import assert from "node:assert/strict";
import { test } from "node:test";

import { createScreenWakeLock, type WakeLockEnv, type WakeLockSentinelLike } from "./wake-lock.ts";

type FakeDocument = WakeLockEnv["document"] & { show: () => void; hide: () => void };

function fakeDocument(): FakeDocument {
  const listeners = new Set<() => void>();
  const doc: FakeDocument = {
    visibilityState: "visible",
    addEventListener: (_type, listener) => listeners.add(listener),
    removeEventListener: (_type, listener) => listeners.delete(listener),
    show: () => {
      doc.visibilityState = "visible";
      listeners.forEach((listener) => listener());
    },
    hide: () => {
      doc.visibilityState = "hidden";
      listeners.forEach((listener) => listener());
    },
  };
  return doc;
}

function fakeSentinel(): WakeLockSentinelLike {
  const sentinel: WakeLockSentinelLike = {
    released: false,
    release: async () => {
      sentinel.released = true;
    },
  };
  return sentinel;
}

function setup(request?: () => Promise<WakeLockSentinelLike>) {
  const doc = fakeDocument();
  const sentinels: WakeLockSentinelLike[] = [];
  const env: WakeLockEnv = {
    document: doc,
    request:
      request ??
      (async () => {
        const sentinel = fakeSentinel();
        sentinels.push(sentinel);
        return sentinel;
      }),
  };
  return { doc, sentinels, wakeLock: createScreenWakeLock(env) };
}

// 탭이 숨겨지면 브라우저가 요청을 스스로 푸는 동작을 흉내 낸다.
function browserReleases(sentinel: WakeLockSentinelLike | undefined) {
  if (sentinel) sentinel.released = true;
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

test("003/AC-11 화면 꺼짐 방지를 켜면 요청하고 켜진 상태로 알린다", async () => {
  const { sentinels, wakeLock } = setup();

  const enabled = await wakeLock.enable();

  assert.equal(enabled, true);
  assert.equal(sentinels.length, 1);
  assert.equal(wakeLock.isActive(), true);
});

test("003/AC-11 탭이 숨겨졌다가 다시 보이면 화면 꺼짐 방지를 다시 요청한다", async () => {
  const { doc, sentinels, wakeLock } = setup();
  await wakeLock.enable();

  doc.hide();
  browserReleases(sentinels[0]);
  doc.show();
  await flush();

  assert.equal(sentinels.length, 2);
  assert.equal(wakeLock.isActive(), true);
});

test("화면 꺼짐 방지를 끄면 요청을 풀고, 탭이 다시 보여도 요청하지 않는다", async () => {
  const { doc, sentinels, wakeLock } = setup();
  await wakeLock.enable();

  await wakeLock.disable();
  doc.hide();
  doc.show();
  await flush();

  assert.equal(sentinels[0]?.released, true);
  assert.equal(sentinels.length, 1);
  assert.equal(wakeLock.isActive(), false);
});

test("003/AC-12 Screen Wake Lock API가 없으면 지원하지 않음으로 알리고 켜기는 false로 끝난다", async () => {
  const doc = fakeDocument();
  const wakeLock = createScreenWakeLock({ document: doc, request: undefined });

  assert.equal(wakeLock.supported, false);
  assert.equal(await wakeLock.enable(), false);
  assert.equal(wakeLock.isActive(), false);
});

test("브라우저가 요청을 거절해도 예외를 밖으로 던지지 않고 false로 끝난다", async () => {
  const { wakeLock } = setup(async () => {
    throw new Error("NotAllowedError");
  });

  assert.equal(await wakeLock.enable(), false);
  assert.equal(wakeLock.isActive(), false);
});

test("화면을 닫을 때 정리하면 요청을 풀고 탭 변화 감시를 멈춘다", async () => {
  const { doc, sentinels, wakeLock } = setup();
  await wakeLock.enable();

  await wakeLock.dispose();
  browserReleases(sentinels[0]);
  doc.show();
  await flush();

  assert.equal(sentinels.length, 1);
  assert.equal(wakeLock.isActive(), false);
});
