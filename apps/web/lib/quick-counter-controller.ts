// 퀵 카운터 화면의 조작과 리셋·되돌리기 상태. docs/specs/003-row-counter/design/state.md의 전이 표를 따른다.
// 값은 QuickCounterStore가 저장하고, 이 컨트롤러는 화면에만 있는 상태(리셋 확인 중, 되돌리기 가능)를 맡는다.
import {
  changeSetSize,
  decrement,
  increment,
  reset,
  undoReset,
  type CounterResult,
  type CounterValueDto,
  type ResetUndoDto,
} from "@hamtteukka/shared";

import type { CounterFeedback } from "./counter-feedback.ts";
import type { QuickCounterStore, StorageMode } from "./quick-counter-store.ts";

export type ScreenPhase = { kind: "counting" } | { kind: "confirming" } | { kind: "undo"; undo: ResetUndoDto };

const COUNTING: ScreenPhase = { kind: "counting" };
const CONFIRMING: ScreenPhase = { kind: "confirming" };

export type QuickCounterController = {
  getPhase(): ScreenPhase;
  subscribe(listener: () => void): () => void;
  increment(): void;
  decrement(): void;
  requestReset(): void;
  cancelReset(): void;
  confirmReset(): void;
  /** 되돌리기 버튼이 보일 때만 동작한다. 리셋 뒤 다른 탭에서 값이 바뀌었으면 UNDO_EXPIRED로 끝난다. */
  undoReset(): CounterResult<CounterValueDto> | undefined;
  /** 1세트당 단수를 정하거나(1 이상의 정수) 지운다(null). 전체 단수는 바뀌지 않는다(003 FR-26). */
  changeSetSize(setSize: number | null): CounterResult<CounterValueDto>;
};

/**
 * 퀵 카운터에 1단을 더하고 켜 둔 피드백을 낸다. 퀵 카운터 화면, 로그아웃 홈의 구역, 이어서 뜨기 바가 같은 함수를 써서
 * 저장과 소리·진동 규칙을 맞춘다(003 FR-41).
 */
export function countUp(store: QuickCounterStore, now: string, feedback?: Pick<CounterFeedback, "play">): CounterValueDto {
  const next = store.update((value) => increment(value, now));
  feedback?.play(store.getSnapshot().settings);
  return next;
}

export function storageNotice(mode: StorageMode): string {
  return mode === "PERSISTENT"
    ? "이 브라우저에만 저장돼요. 브라우저 데이터를 지우면 사라져요."
    : "탭을 닫거나 새로 고침하면 값이 사라져요.";
}

/**
 * @param feedback 더하기와 빼기로 값이 바뀌면 저장된 설정 가운데 켜 둔 피드백만 낸다(003 FR-09).
 * 값이 0일 때 빼기처럼 값이 바뀌지 않으면 피드백을 내지 않는다.
 */
export function createQuickCounterController(
  store: QuickCounterStore,
  clock: () => string = () => new Date().toISOString(),
  feedback?: Pick<CounterFeedback, "play">,
): QuickCounterController {
  let phase: ScreenPhase = COUNTING;
  const listeners = new Set<() => void>();
  let unsubscribeStore: (() => void) | undefined;

  function setPhase(next: ScreenPhase) {
    if (next === phase) return;
    phase = next;
    listeners.forEach((listener) => listener());
  }

  return {
    getPhase: () => phase,
    // 화면이 구독하는 동안에만 저장소를 구독한다. 화면을 붙였다 떼도 따로 정리할 일이 남지 않는다.
    subscribe(listener) {
      listeners.add(listener);
      // 되돌리기 버튼이 보이는 동안 다른 탭에서 값이 바뀌면 되돌리기 정보를 버린다.
      unsubscribeStore ??= store.subscribe((change) => {
        if (change === "external" && phase.kind === "undo") setPhase(COUNTING);
      });
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          unsubscribeStore?.();
          unsubscribeStore = undefined;
        }
      };
    },
    increment() {
      countUp(store, clock(), feedback);
      setPhase(COUNTING);
    },
    decrement() {
      let changed = false;
      store.update((value) => {
        const next = decrement(value, clock());
        changed = next !== value;
        return next;
      });
      setPhase(COUNTING);
      if (changed) feedback?.play(store.getSnapshot().settings);
    },
    requestReset() {
      setPhase(CONFIRMING);
    },
    cancelReset() {
      setPhase(COUNTING);
    },
    confirmReset() {
      let undo: ResetUndoDto | undefined;
      store.update((value) => {
        const result = reset(value, clock());
        undo = result.undo;
        return result.value;
      });
      setPhase(undo ? { kind: "undo", undo } : COUNTING);
    },
    undoReset() {
      if (phase.kind !== "undo") return undefined;
      const { undo } = phase;
      const result = store.tryUpdate((latest) => undoReset(latest, undo, clock()));
      setPhase(COUNTING);
      return result;
    },
    changeSetSize(setSize) {
      const result = store.tryUpdate((latest) => changeSetSize(latest, setSize));
      // 잘못된 값이면 아무 조작도 하지 않았으므로 되돌리기 버튼을 그대로 둔다.
      if (result.ok) setPhase(COUNTING);
      return result;
    },
  };
}
