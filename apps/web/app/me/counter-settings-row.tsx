"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";

import { getQuickCounterStore } from "@/lib/quick-counter-store";

import { useCounterSupport, useQuickCounterSnapshot } from "../_components/counter-hooks";
import { CounterSettingsSheet } from "../_components/counter-settings-sheet";

/** 내 정보 화면의 '카운터 소리와 진동' 행. 퀵 카운터 화면의 더 보기와 같은 설정 시트를 연다. */
export function CounterSettingsRow() {
  const [open, setOpen] = useState(false);
  const { settings } = useQuickCounterSnapshot();
  const support = useCounterSupport();

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="flex min-h-12 w-full items-center justify-between gap-4 py-3 text-left"
      >
        <span>
          카운터 소리와 진동
          <span className="block text-caption text-muted">이 브라우저에만 저장돼요.</span>
        </span>
        <ChevronRight aria-hidden="true" size={18} strokeWidth={1.75} className="text-muted" />
      </button>
      <CounterSettingsSheet
        open={open}
        onClose={() => setOpen(false)}
        settings={settings}
        support={support}
        onChange={(patch) => getQuickCounterStore().updateSettings(patch)}
      />
    </>
  );
}
