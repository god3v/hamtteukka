"use client";

// 퀵 카운터 화면, 로그아웃 홈의 퀵 카운터 구역, 이어서 뜨기 바, 내 정보 화면이 함께 쓰는 브라우저 상태.
// 서버에서 그릴 때와 하이드레이션 중에는 기본값을 쓴다.
import { useEffect, useState, useSyncExternalStore } from "react";

import { isEditableElement } from "@/lib/continue-bar";
import { browserFeedbackEnv, createCounterFeedback, type CounterFeedback } from "@/lib/counter-feedback";
import { createQuickCounterController, type QuickCounterController } from "@/lib/quick-counter-controller";
import { getQuickCounterStore, SERVER_SNAPSHOT, type QuickCounterSnapshot } from "@/lib/quick-counter-store";
import { browserWakeLockEnv } from "@/lib/wake-lock";

const CLOCK_INTERVAL = 30_000;

export const subscribeNothing = () => () => {};
const subscribeStore = (listener: () => void) => getQuickCounterStore().subscribe(listener);
const getStoreSnapshot = () => getQuickCounterStore().getSnapshot();
const getServerSnapshot = () => SERVER_SNAPSHOT;

/** 이 탭의 퀵 카운터 값, 설정, 저장 방식. */
export function useQuickCounterSnapshot(): QuickCounterSnapshot {
  return useSyncExternalStore(subscribeStore, getStoreSnapshot, getServerSnapshot);
}

/** 브라우저에서 저장된 값을 읽기 전에는 false다. 서버 HTML에 기본값이 잠깐 보이지 않게 가릴 때 쓴다. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
}

/** 지난 시각 표기를 새로 그리기 위한 현재 시각. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), CLOCK_INTERVAL);
    return () => clearInterval(id);
  }, []);
  return now;
}

let feedback: CounterFeedback | undefined;

/** 이 탭의 소리·진동 피드백. 브라우저에서만 부른다. */
export function getCounterFeedback(): CounterFeedback {
  feedback ??= createCounterFeedback(browserFeedbackEnv());
  return feedback;
}

/** 화면마다 하나씩 만드는 퀵 카운터 컨트롤러. 저장소와 피드백은 브라우저에만 있으므로 서버에서는 null이다. */
export function createBrowserController(): QuickCounterController | null {
  return typeof window === "undefined"
    ? null
    : createQuickCounterController(getQuickCounterStore(), undefined, getCounterFeedback());
}

/** 이 브라우저가 지원하는 기능. 지원하지 않는 설정은 비활성으로 보여 준다(003 NFR-04, NFR-07). */
export type CounterSupport = { sound: boolean; vibration: boolean; keepScreenOn: boolean };

const NO_SUPPORT: CounterSupport = { sound: false, vibration: false, keepScreenOn: false };
let support: CounterSupport | undefined;

function getSupport(): CounterSupport {
  support ??= { ...getCounterFeedback().support, keepScreenOn: browserWakeLockEnv().request !== undefined };
  return support;
}

export function useCounterSupport(): CounterSupport {
  return useSyncExternalStore(subscribeNothing, getSupport, () => NO_SUPPORT);
}

// 입력창에 포커스가 들어오거나 나갈 때 화면 키보드 상태를 다시 읽는다.
function subscribeFocus(listener: () => void) {
  document.addEventListener("focusin", listener);
  document.addEventListener("focusout", listener);
  return () => {
    document.removeEventListener("focusin", listener);
    document.removeEventListener("focusout", listener);
  };
}

const getKeyboardOpen = () => isEditableElement(document.activeElement);

/** 글자를 입력하는 요소에 포커스가 있으면 화면 키보드가 열린 것으로 본다(003 FR-39). */
export function useKeyboardOpen(): boolean {
  return useSyncExternalStore(subscribeFocus, getKeyboardOpen, () => false);
}
