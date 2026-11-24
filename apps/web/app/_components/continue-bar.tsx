"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { shouldShowContinueBar } from "@/lib/continue-bar";
import { formatRows } from "@/lib/counter-format";
import { countUp } from "@/lib/quick-counter-controller";
import { getQuickCounterStore } from "@/lib/quick-counter-store";

import { getCounterFeedback, useKeyboardOpen, useQuickCounterSnapshot } from "./counter-hooks";

/**
 * 하단 탭 바로 위에 띄우는 이어서 뜨기 바. 로그인하지 않은 방문자에게는 퀵 카운터로 센 적이 있을 때만 보인다(003 FR-37~FR-41).
 * 바를 누르면 퀵 카운터 화면을 열고, +1은 화면을 열지 않고 퀵 카운터 화면과 같은 countUp으로 더한다.
 * 모양은 docs/design/visual-system.md의 이어서 뜨기 바 규칙(float 바탕, 12px 모서리, accent +1 버튼)을 따른다.
 */
export function ContinueBar() {
  const pathname = usePathname();
  const { value } = useQuickCounterSnapshot();
  const keyboardOpen = useKeyboardOpen();

  if (!shouldShowContinueBar({ pathname, lastCountedAt: value.lastCountedAt, keyboardOpen })) return null;

  const rows = formatRows(value.total);

  return (
    <div role="region" aria-label="이어서 뜨기" className="px-4 pb-2">
      <div className="flex items-center rounded-xl bg-float text-on-float">
        <Link href="/quick-counter" className="flex min-h-14 min-w-0 flex-1 flex-col justify-center px-4 py-2">
          <span className="text-micro text-on-float-muted">퀵 카운터</span>
          <span className="text-base leading-tight font-bold tabular-nums">{rows}</span>
        </Link>
        <button
          type="button"
          aria-label="퀵 카운터에 1단 더하기"
          onClick={() => countUp(getQuickCounterStore(), new Date().toISOString(), getCounterFeedback())}
          className="mr-1.5 inline-flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-lg bg-accent text-label text-on-accent select-none active:bg-accent-strong"
        >
          +1
        </button>
      </div>
      {/* 바에서 더하면 화면 읽기 프로그램이 새 값을 읽는다(003 NFR-08). */}
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {rows}
      </p>
    </div>
  );
}
