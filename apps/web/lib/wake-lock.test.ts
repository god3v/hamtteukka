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

// 테스트가 끝나는 시점을 정할 수 있는 요청. 요청이 진행 중일 때의 동작을 확인한다.
function deferredRequests() {
  const pending: Array<(sentinel: WakeLockSentinelLike) => void> = [];
  const sentinels: WakeLockSentinelLike[] = [];
  const request = () =>
    new Promise<WakeLockSentinelLike>((resolve) => {
      pending.push((sentinel) => {
        sentinels.push(sentinel);
        resolve(sentinel);
      });
    });
  const resolveAll = () => pending.splice(0).forEach((resolve) => resolve(fakeSentinel()));
  return { request, pending, sentinels, resolveAll };
}

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

test("003/AC-11 요청이 진행 중일 때 켜기를 다시 불러도 요청은 한 번만 보내고, 끄면 그 요청을 푼다", async () => {
  const requests = deferredRequests();
  const wakeLock = createScreenWakeLock({ document: fakeDocument(), request: requests.request });

  const first = wakeLock.enable();
  const second = wakeLock.enable();
  assert.equal(requests.pending.length, 1);
  requests.resolveAll();

  assert.deepEqual(await Promise.all([first, second]), [true, true]);
  await wakeLock.disable();
  assert.equal(requests.sentinels.length, 1);
  assert.equal(requests.sentinels[0]?.released, true);
  assert.equal(wakeLock.isActive(), false);
});

test("003/AC-11 요청이 끝나기 전에 끄면 받은 요청을 바로 풀고 켜진 상태로 남지 않는다", async () => {
  const requests = deferredRequests();
  const wakeLock = createScreenWakeLock({ document: fakeDocument(), request: requests.request });

  const enabled = wakeLock.enable();
  const disabled = wakeLock.disable();
  requests.resolveAll();

  assert.equal(await enabled, false);
  await disabled;
  assert.equal(requests.sentinels[0]?.released, true);
  assert.equal(wakeLock.isActive(), false);
});

test("003/AC-11 요청이 끝나기 전에 화면을 닫아 정리해도 받은 요청을 바로 푼다", async () => {
  const requests = deferredRequests();
  const wakeLock = createScreenWakeLock({ document: fakeDocument(), request: requests.request });

  const enabled = wakeLock.enable();
  const disposed = wakeLock.dispose();
  requests.resolveAll();

  assert.equal(await enabled, false);
  await disposed;
  assert.equal(requests.sentinels[0]?.released, true);
  assert.equal(wakeLock.isActive(), false);
});

test("003/AC-11 화면 꺼짐 방지를 끄면 요청을 풀고, 탭이 다시 보여도 요청하지 않는다", async () => {
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

test("003/AC-12 브라우저가 요청을 거절해도 예외를 밖으로 던지지 않고 false로 끝난다", async () => {
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

test("003/AC-11 화면 꺼짐 방지가 걸리거나 풀릴 때마다 구독자에게 알려, 상태 줄 표시를 바꿀 수 있다", async () => {
  const { doc, sentinels, wakeLock } = setup();
  const seen: boolean[] = [];
  const unsubscribe = wakeLock.subscribe(() => seen.push(wakeLock.isActive()));

  await wakeLock.enable();
  browserReleases(sentinels[0]);
  doc.hide();
  doc.show();
  await flush();
  await wakeLock.disable();
  unsubscribe();
  await wakeLock.enable();

  assert.deepEqual(seen, [true, false, true, false]);
});

test("003/AC-11 요청이 끝나기 전에 화면을 정리했다가 바로 다시 켜도 화면 꺼짐 방지가 걸린 채로 남는다", async () => {
  const requests = deferredRequests();
  const wakeLock = createScreenWakeLock({ document: fakeDocument(), request: requests.request });

  const first = wakeLock.enable();
  const disposed = wakeLock.dispose();
  const second = wakeLock.enable();
  requests.resolveAll();
  await Promise.all([first, disposed, second]);

  assert.equal(requests.sentinels[0]?.released, false);
  assert.equal(wakeLock.isActive(), true);
});
