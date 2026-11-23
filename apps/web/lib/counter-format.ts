// 카운터 화면에 보이는 단수, 반복 위치, 마지막으로 센 시각 문구. docs/design/brand.md의 '숫자와 날짜' 표를 따른다.
import type { RepeatPositionDto } from "@hamtteukka/shared";

import { formatElapsed } from "./elapsed-time.ts";

export function formatRows(total: number): string {
  return `${total}단`;
}

/** 1세트당 단수가 없으면 null이다. 전체 단수가 0이면 '시작 전'으로 쓴다(003 요구사항의 반복 표시 식). */
export function formatRepeatPosition(position: RepeatPositionDto): string | null {
  switch (position.kind) {
    case "NONE":
      return null;
    case "NOT_STARTED":
      return "시작 전";
    case "POSITION":
      return `${position.set}세트 ${position.row}단`;
  }
}

export function formatLastCounted(lastCountedAt: string | null, now: Date): string {
  if (lastCountedAt === null) return "아직 세지 않았어요.";
  const elapsed = formatElapsed(lastCountedAt, now);
  // '방금'과 '어제'는 그대로 부사로 쓰고, 'n분 전'이나 날짜에는 '에'를 붙인다.
  const particle = elapsed === "방금" || elapsed === "어제" ? "" : "에";
  return `${elapsed}${particle} 셌어요.`;
}

/** 반복 설정 입력을 읽는다. 비어 있으면 반복 설정을 지우는 null이고, 나머지는 숫자로 바꿔 changeSetSize가 검사하게 한다. */
export function parseSetSizeInput(text: string): number | null {
  const trimmed = text.trim();
  return trimmed === "" ? null : Number(trimmed);
}
