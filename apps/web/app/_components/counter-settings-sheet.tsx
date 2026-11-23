"use client";

import { useId } from "react";

import type { CounterSettingsDto } from "@hamtteukka/shared";

import { BottomSheet } from "./bottom-sheet";
import type { CounterSupport } from "./counter-hooks";

const UNSUPPORTED = "이 브라우저에서는 쓸 수 없어요.";

type CounterSettingsSheetProps = {
  open: boolean;
  onClose(): void;
  settings: CounterSettingsDto;
  support: CounterSupport;
  onChange(patch: Partial<CounterSettingsDto>): void;
};

/**
 * 소리, 진동, 화면 꺼짐 방지 설정 시트. 퀵 카운터 화면의 더 보기와 내 정보 화면에서 연다.
 * 지원하지 않는 기능은 비활성으로 보여 주고, 화면 꺼짐 방지를 지원하지 않으면 자동 잠금 시간을 늘리는 방법을 안내한다
 * (003 FR-09~FR-11, NFR-04, NFR-07).
 */
export function CounterSettingsSheet({ open, onClose, settings, support, onChange }: CounterSettingsSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="카운터 설정">
      <div className="divide-y divide-line">
        <SettingSwitch
          label="소리"
          description={support.sound ? "누를 때마다 짧은 소리를 내요." : UNSUPPORTED}
          checked={support.sound && settings.sound}
          disabled={!support.sound}
          onChange={(sound) => onChange({ sound })}
        />
        <SettingSwitch
          label="진동"
          description={support.vibration ? "누를 때마다 짧게 진동해요." : UNSUPPORTED}
          checked={support.vibration && settings.vibration}
          disabled={!support.vibration}
          onChange={(vibration) => onChange({ vibration })}
        />
        <SettingSwitch
          label="화면 꺼짐 방지"
          description={support.keepScreenOn ? "카운터 화면을 보는 동안 화면이 꺼지지 않아요." : UNSUPPORTED}
          checked={support.keepScreenOn && settings.keepScreenOn}
          disabled={!support.keepScreenOn}
          onChange={(keepScreenOn) => onChange({ keepScreenOn })}
        />
      </div>
      {support.keepScreenOn ? null : (
        <p className="mt-2 rounded-lg bg-surface-muted px-3 py-2.5 text-caption text-secondary">
          화면이 자꾸 꺼지면 기기 설정에서 자동 잠금 시간을 늘려 주세요. iPhone은 &apos;설정 &gt; 디스플레이 및 밝기 &gt;
          자동 잠금&apos;에서, Android는 &apos;설정 &gt; 디스플레이&apos;에서 바꿀 수 있어요.
        </p>
      )}
      <p className="pt-3 text-caption text-muted">이 설정은 이 브라우저에만 저장돼요.</p>
    </BottomSheet>
  );
}

type SettingSwitchProps = {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange(checked: boolean): void;
};

/** 켜고 끄는 스위치 행. 켠 상태는 강조 색 대신 선택된 필터 칩처럼 ink 바탕으로 그린다. */
function SettingSwitch({ label, description, checked, disabled, onChange }: SettingSwitchProps) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p id={`${id}-label`} className="font-semibold">
          {label}
        </p>
        <p id={`${id}-description`} className="text-caption text-muted">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-description`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="inline-flex h-11 w-14 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
      >
        <span aria-hidden="true" className={`relative h-7 w-12 rounded-full ${checked ? "bg-ink" : "bg-line-strong"}`}>
          <span
            className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-surface transition-transform motion-reduce:transition-none ${
              checked ? "translate-x-5" : ""
            }`}
          />
        </span>
      </button>
    </div>
  );
}
