"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

type BottomSheetProps = {
  open: boolean;
  /** Esc 키, 바깥 누르기로 닫을 때 부른다. 부모가 open을 false로 바꾸면 시트가 닫힌다. */
  onClose(): void;
  title: string;
  children: ReactNode;
};

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * 화면 아래에서 올라오는 시트. docs/design/visual-system.md의 바텀 시트 규칙(surface 바탕, 위쪽 모서리 12px, 맨 위 손잡이)을 따른다.
 * 브라우저 기본 <dialog>로 만들어 포커스 가두기와 Esc 처리를 맡기고, 닫을 때는 내려가는 움직임이 끝난 뒤 닫는다.
 */
export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      dialog.removeAttribute("data-closing");
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (!dialog.open) return;
    if (prefersReducedMotion()) {
      dialog.close();
      return;
    }
    const finish = (event: AnimationEvent) => {
      if (event.target !== dialog) return;
      dialog.removeAttribute("data-closing");
      dialog.close();
    };
    dialog.setAttribute("data-closing", "");
    dialog.addEventListener("animationend", finish);
    return () => dialog.removeEventListener("animationend", finish);
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // 다른 방법으로 닫혀도 부모의 open 값과 맞춘다. open이 false가 되어 닫은 경우에는 아무것도 하지 않는다.
      onClose={() => {
        if (open) onClose();
      }}
      // 시트 바깥의 어두운 배경을 누르면 닫는다. 시트 안쪽은 아래 div가 채우므로 여기에 걸리지 않는다.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="mx-auto mt-auto mb-0 max-h-[85dvh] w-full max-w-[600px] rounded-t-xl bg-surface text-ink backdrop:bg-float/60 motion-safe:animate-sheet-up motion-safe:data-closing:animate-sheet-down"
    >
      <div className="px-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div aria-hidden="true" className="mx-auto h-1 w-9 rounded-full bg-line" />
        <h2 id={titleId} className="pt-4 pb-2 text-title-2">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
