"use client";

// 퀵 카운터 화면과 내 정보 화면이 함께 쓰는 브라우저 상태. 서버에서 그릴 때와 하이드레이션 중에는 기본값을 쓴다.
import { useSyncExternalStore } from "react";

import { browserFeedbackEnv, createCounterFeedback, type CounterFeedback } from "@/lib/counter-feedback";
import { getQuickCounterStore, SERVER_SNAPSHOT, type QuickCounterSnapshot } from "@/lib/quick-counter-store";
import { browserWakeLockEnv } from "@/lib/wake-lock";

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

let feedback: CounterFeedback | undefined;

/** 이 탭의 소리·진동 피드백. 브라우저에서만 부른다. */
export function getCounterFeedback(): CounterFeedback {
  feedback ??= createCounterFeedback(browserFeedbackEnv());
  return feedback;
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
