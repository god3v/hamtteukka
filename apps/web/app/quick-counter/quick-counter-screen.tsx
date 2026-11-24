"use client";

import { ChevronRight, Ellipsis, Minus, Sun, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { getRepeatPosition } from "@hamtteukka/shared";

import { formatLastCounted, formatRepeatPosition, formatRows } from "@/lib/counter-format";
import { inAppHistory, stepsBack } from "@/lib/in-app-history";
import { storageNotice, type ScreenPhase } from "@/lib/quick-counter-controller";
import { getQuickCounterStore } from "@/lib/quick-counter-store";
import { browserWakeLockEnv, createScreenWakeLock, type ScreenWakeLock } from "@/lib/wake-lock";

import { BottomSheet } from "../_components/bottom-sheet";
import {
  createBrowserController,
  subscribeNothing,
  useCounterSupport,
  useHydrated,
  useNow,
  useQuickCounterSnapshot,
} from "../_components/counter-hooks";
import { CounterSettingsSheet } from "../_components/counter-settings-sheet";
import { RepeatSheet } from "./repeat-sheet";

const COUNTING: ScreenPhase = { kind: "counting" };
const UNDO_EXPIRED_MESSAGE = "되돌리지 못했어요. 다른 탭에서 값을 바꿨어요.";
const TOAST_DURATION = 3_000;

const getCountingPhase = () => COUNTING;
const getInactive = () => false;

type Sheet = "menu" | "repeat" | "settings" | null;

// 화면 꺼짐 방지는 브라우저에서만 만든다. 서버에서 그릴 때는 null이다.
function createWakeLock(): ScreenWakeLock | null {
  return typeof window === "undefined" ? null : createScreenWakeLock(browserWakeLockEnv());
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function QuickCounterScreen() {
  const router = useRouter();
  const [controller] = useState(createBrowserController);
  const [wakeLock] = useState(createWakeLock);
  const { value, settings, mode } = useQuickCounterSnapshot();
  const phase = useSyncExternalStore(
    controller?.subscribe ?? subscribeNothing,
    controller?.getPhase ?? getCountingPhase,
    getCountingPhase,
  );
  const keepingScreenOn = useSyncExternalStore(
    wakeLock?.subscribe ?? subscribeNothing,
    wakeLock?.isActive ?? getInactive,
    getInactive,
  );
  const support = useCounterSupport();
  const hydrated = useHydrated();
  const now = useNow();
  const [closing, setClosing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);

  useEffect(() => {
    if (toast === null) return;
    const id = setTimeout(() => setToast(null), TOAST_DURATION);
    return () => clearTimeout(id);
  }, [toast]);

  // 설정에서 화면 꺼짐 방지를 켜 두었으면 이 화면을 보는 동안만 요청하고, 화면을 닫으면 푼다(003 NFR-03).
  useEffect(() => {
    if (!wakeLock) return;
    if (settings.keepScreenOn) void wakeLock.enable();
    else void wakeLock.disable();
  }, [wakeLock, settings.keepScreenOn]);

  useEffect(() => {
    return () => void wakeLock?.dispose();
  }, [wakeLock]);

  const rows = formatRows(value.total);
  const position = formatRepeatPosition(getRepeatPosition(value.total, value.setSize));
  const announcement = position ? `${rows}, ${position}` : rows;

  // 앱 안에서 열었으면 열기 전 화면으로 돌아가고, 주소로 바로 들어왔으면 로그아웃 홈으로 간다.
  // 이 화면에서 생긴 해시 기록(#main)은 건너뛴다.
  function leave() {
    if (inAppHistory.canGoBack()) window.history.go(-stepsBack(window.location.hash));
    else router.replace("/");
  }

  function close() {
    if (prefersReducedMotion()) leave();
    else setClosing(true);
  }

  function undoReset() {
    const result = controller?.undoReset();
    if (result && !result.ok) setToast(UNDO_EXPIRED_MESSAGE);
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas">
      <div
        onAnimationEnd={(event) => {
          if (closing && event.target === event.currentTarget) leave();
        }}
        className={`flex min-h-0 flex-1 flex-col rounded-t-xl bg-surface ${
          closing ? "motion-safe:animate-sheet-down" : "motion-safe:animate-sheet-up"
        }`}
      >
        <header className="pt-[env(safe-area-inset-top)]">
          <div aria-hidden="true" className="mx-auto mt-2 h-1 w-9 rounded-full bg-line" />
          <div className="grid h-12.5 grid-cols-[44px_1fr_44px] items-center px-4">
            <button
              type="button"
              aria-label="닫기"
              onClick={close}
              className="-ml-3 inline-flex size-11 items-center justify-center rounded-md text-ink"
            >
              <X aria-hidden="true" size={20} strokeWidth={1.75} />
            </button>
            <h1 className="text-center text-title-2">퀵 카운터</h1>
            <button
              type="button"
              aria-label="더 보기"
              aria-haspopup="dialog"
              onClick={() => setSheet("menu")}
              className="-mr-3 inline-flex size-11 items-center justify-center justify-self-end rounded-md text-ink"
            >
              <Ellipsis aria-hidden="true" size={20} strokeWidth={1.75} />
            </button>
          </div>
        </header>

        <main id="main" className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4">
            {/* 상태 줄. 리셋 버튼은 더하기·빼기 버튼과 떨어진 위쪽에 작게 둔다(003 NFR-06).
                리셋 직후에는 같은 자리의 같은 버튼이 되돌리기로 바뀌어, 확인 창을 닫은 뒤에도 포커스가 남는다. */}
            <div className="flex h-11 items-center">
              {/* 화면 꺼짐 방지가 걸려 있는 동안 왼쪽에 표시한다(003 FR-10). */}
              {keepingScreenOn ? (
                <p className="flex items-center gap-1 text-caption text-secondary">
                  <Sun aria-hidden="true" size={14} strokeWidth={1.75} />
                  화면 꺼짐 방지 중
                </p>
              ) : null}
              <button
                type="button"
                onClick={phase.kind === "undo" ? undoReset : () => controller?.requestReset()}
                aria-label={phase.kind === "undo" ? "리셋 되돌리기" : "카운터 리셋"}
                className={`-mr-3 ml-auto inline-flex min-h-11 items-center px-3 text-label ${
                  phase.kind === "undo" ? "text-ink" : "text-secondary"
                }`}
              >
                {phase.kind === "undo" ? "되돌리기" : "리셋"}
              </button>
            </div>

            <div
              className={`flex flex-1 flex-col items-center justify-center gap-2 py-6 ${hydrated ? "" : "invisible"}`}
            >
              <p className="flex items-baseline gap-1">
                <span className="text-counter-xl tabular-nums">{value.total}</span>
                <span className="text-title-1">단</span>
              </p>
              {position ? <p className="text-title-2 text-secondary tabular-nums">{position}</p> : null}
            </div>

            <p className="rounded-lg bg-surface-muted px-3 py-2.5 text-caption text-secondary">{storageNotice(mode)}</p>
            <p className={`pt-3 pb-1 text-center text-caption text-muted ${hydrated ? "" : "invisible"}`}>
              {formatLastCounted(value.lastCountedAt, now)}
            </p>
          </div>

          {/* 값이 바뀌면 화면 읽기 프로그램이 새 값을 읽는다(003 NFR-08). */}
          <p aria-live="polite" aria-atomic="true" className="sr-only">
            {hydrated ? announcement : ""}
          </p>

          <div className="relative flex gap-3 px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div role="status" className="pointer-events-none absolute inset-x-4 bottom-full">
              {toast ? <p className="rounded-xl bg-float px-4 py-3 text-on-float">{toast}</p> : null}
            </div>
            <button
              type="button"
              aria-label="1단 빼기"
              onClick={() => controller?.decrement()}
              className="inline-flex size-22 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-line-strong text-ink select-none active:bg-surface-muted"
            >
              <Minus aria-hidden="true" size={28} strokeWidth={1.75} />
            </button>
            {/* +1단 버튼은 화면에서 가장 큰 조작 요소로, 엄지가 닿는 맨 아래에 높이 88px로 둔다(003 NFR-05). */}
            <button
              type="button"
              aria-label="1단 더하기"
              onClick={() => controller?.increment()}
              className="h-22 flex-1 touch-manipulation rounded-xl bg-accent text-title-1 text-on-accent select-none active:bg-accent-strong"
            >
              +1단
            </button>
          </div>
        </main>
      </div>

      <ResetDialog
        open={phase.kind === "confirming"}
        rows={rows}
        onCancel={() => controller?.cancelReset()}
        onConfirm={() => controller?.confirmReset()}
      />

      <BottomSheet open={sheet === "menu"} onClose={() => setSheet(null)} title="더 보기">
        <ul className="divide-y divide-line">
          <li>
            <button
              type="button"
              onClick={() => setSheet("repeat")}
              className="flex min-h-12 w-full items-center justify-between gap-4 py-3 text-left"
            >
              반복 설정
              <span className="flex items-center gap-1 text-caption text-muted">
                {value.setSize === null ? "없음" : `${value.setSize}단마다`}
                <ChevronRight aria-hidden="true" size={18} strokeWidth={1.75} />
              </span>
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => setSheet("settings")}
              className="flex min-h-12 w-full items-center justify-between gap-4 py-3 text-left"
            >
              카운터 설정
              <ChevronRight aria-hidden="true" size={18} strokeWidth={1.75} className="text-muted" />
            </button>
          </li>
        </ul>
      </BottomSheet>

      <RepeatSheet
        open={sheet === "repeat"}
        onClose={() => setSheet(null)}
        setSize={value.setSize}
        onSave={(setSize) =>
          controller ? controller.changeSetSize(setSize) : { ok: false, error: "INVALID_STORED_VALUE" }
        }
      />

      <CounterSettingsSheet
        open={sheet === "settings"}
        onClose={() => setSheet(null)}
        settings={settings}
        support={support}
        onChange={(patch) => getQuickCounterStore().updateSettings(patch)}
      />
    </div>
  );
}

type ResetDialogProps = {
  open: boolean;
  /** 대화상자에 보여 줄 현재 값. 다른 탭에서 값이 바뀌면 함께 바뀐다. */
  rows: string;
  onCancel(): void;
  onConfirm(): void;
};

/** 리셋 확인 창. 현재 값을 보여 주고, 리셋을 눌러야 값을 0으로 바꾼다(003 FR-05). */
function ResetDialog({ open, rows, onCancel, onConfirm }: ResetDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="reset-title"
      aria-describedby="reset-description"
      // Esc 키로 닫으면 취소와 같다. 대화상자는 open 값이 false가 되면 닫는다.
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      // 다른 방법으로 닫혀도 리셋 확인 중에 머물지 않게 한다. open이 false가 되어 닫은 경우에는 아무것도 하지 않는다.
      onClose={() => {
        if (open) onCancel();
      }}
      className="m-auto w-[calc(100%-32px)] max-w-[340px] rounded-xl bg-surface p-5 text-ink backdrop:bg-float/60"
    >
      <h2 id="reset-title" className="text-title-2">
        카운터를 0단으로 리셋할까요?
      </h2>
      <p id="reset-description" className="mt-2 text-secondary">
        지금 {rows}이에요.
      </p>
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-11 flex-1 rounded-md border border-line-strong font-semibold text-ink"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="h-11 flex-1 rounded-md bg-accent font-semibold text-on-accent active:bg-accent-strong"
        >
          리셋
        </button>
      </div>
    </dialog>
  );
}
