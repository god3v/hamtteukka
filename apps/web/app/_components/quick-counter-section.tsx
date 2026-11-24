"use client";

import { ChevronRight, Minus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { formatLastCounted, formatRows } from "@/lib/counter-format";
import { storageNotice } from "@/lib/quick-counter-controller";

import { createBrowserController, useHydrated, useNow, useQuickCounterSnapshot } from "./counter-hooks";

/**
 * 로그아웃 홈의 퀵 카운터 구역. 가입하기 전에 퀵 카운터를 바로 써 보게 한다(003 FR-12~FR-15).
 * 배치는 docs/design/r1-screens.md의 로그아웃 홈 절을 따르고, 리셋은 퀵 카운터 화면에서만 한다.
 */
export function QuickCounterSection() {
  const [controller] = useState(createBrowserController);
  const { value, mode } = useQuickCounterSnapshot();
  const hydrated = useHydrated();
  const now = useNow();
  const rows = formatRows(value.total);

  return (
    <section aria-labelledby="quick-counter" className="border-t border-line py-6">
      <div className="flex items-center justify-between gap-4">
        <h2 id="quick-counter" className="text-title-2">
          퀵 카운터
        </h2>
        <Link
          href="/quick-counter"
          className="-mr-2 inline-flex min-h-11 items-center gap-0.5 px-2 text-label text-secondary"
        >
          크게 보기
          <ChevronRight aria-hidden="true" size={16} strokeWidth={1.75} />
        </Link>
      </div>

      {/* 브라우저에 저장된 값을 읽기 전에는 0단이 잠깐 보이지 않게 가린다. */}
      <div className={hydrated ? "" : "invisible"}>
        <p className="mt-2 flex items-baseline gap-1">
          <span className="text-counter-m tabular-nums">{value.total}</span>
          <span className="text-title-2">단</span>
        </p>
        <p className="mt-1 text-caption text-muted">{formatLastCounted(value.lastCountedAt, now)}</p>
      </div>

      {/* 값이 바뀌면 화면 읽기 프로그램이 새 값을 읽는다(003 NFR-08). */}
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {hydrated ? rows : ""}
      </p>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          aria-label="1단 빼기"
          onClick={() => controller?.decrement()}
          className="inline-flex size-14 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-line-strong text-ink select-none active:bg-surface-muted"
        >
          <Minus aria-hidden="true" size={24} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          aria-label="1단 더하기"
          onClick={() => controller?.increment()}
          className="h-14 flex-1 touch-manipulation rounded-xl bg-accent text-title-2 text-on-accent select-none active:bg-accent-strong"
        >
          +1단
        </button>
      </div>

      <p className="mt-3 rounded-lg bg-surface-muted px-3 py-2.5 text-caption text-secondary">{storageNotice(mode)}</p>
    </section>
  );
}
