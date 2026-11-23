"use client";

import { useId, useState } from "react";

import type { CounterResult, CounterValueDto } from "@hamtteukka/shared";

import { parseSetSizeInput } from "@/lib/counter-format";

import { BottomSheet } from "../_components/bottom-sheet";

type RepeatSheetProps = {
  open: boolean;
  onClose(): void;
  /** 지금 정해 둔 1세트당 단수. 시트를 열 때 입력창의 처음 값이 된다. */
  setSize: number | null;
  onSave(setSize: number | null): CounterResult<CounterValueDto>;
};

/** 1세트당 단수를 입력하거나 지우는 시트(003 FR-25, FR-26). 1 이상의 정수가 아니면 저장하지 않고 안내한다. */
export function RepeatSheet({ open, onClose, setSize, onSave }: RepeatSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="반복 설정">
      {/* 열 때마다 입력창을 지금 값으로 다시 채운다. */}
      {open ? <RepeatForm setSize={setSize} onSave={onSave} onClose={onClose} /> : null}
    </BottomSheet>
  );
}

function RepeatForm({ setSize, onSave, onClose }: Omit<RepeatSheetProps, "open">) {
  const id = useId();
  const [text, setText] = useState(setSize === null ? "" : String(setSize));
  const [invalid, setInvalid] = useState(false);

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const result = onSave(parseSetSizeInput(text));
        if (result.ok) onClose();
        else setInvalid(true);
      }}
    >
      <p className="pb-4 text-secondary">1세트가 몇 단인지 정하면 &apos;n세트 m단&apos;으로 보여 줘요.</p>
      <label htmlFor={`${id}-input`} className="text-label">
        1세트당 단수
      </label>
      <input
        id={`${id}-input`}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setInvalid(false);
        }}
        aria-invalid={invalid}
        aria-describedby={`${id}-hint`}
        className="mt-1 h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-ink aria-invalid:border-danger"
      />
      {invalid ? (
        <p id={`${id}-hint`} className="mt-1 text-caption text-danger">
          저장하지 못했어요. 1 이상의 정수를 입력해 주세요.
        </p>
      ) : (
        <p id={`${id}-hint`} className="mt-1 text-caption text-muted">
          비워 두고 저장하면 반복 표시를 끄고 전체 단수만 보여 줘요.
        </p>
      )}
      <button
        type="submit"
        className="mt-5 h-11 w-full rounded-md bg-accent font-semibold text-on-accent active:bg-accent-strong"
      >
        저장
      </button>
    </form>
  );
}
