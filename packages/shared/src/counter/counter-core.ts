// 단수 카운터 값을 계산하는 순수 함수 모음. docs/specs/003-row-counter/design/domain.md의 counterCore를 따른다.
// 저장 위치(브라우저 저장소, 2차 설계의 DB)를 모르므로 퀵 카운터와 프로젝트 카운터가 함께 쓴다.
import { z } from "zod";

export const counterValueSchema = z.object({
  /** 전체 단수. 0 이상의 정수다. */
  total: z.number().int().min(0),
  /** 1세트당 단수. 정하지 않았으면 null이다. */
  setSize: z.number().int().min(1).nullable(),
  /** 마지막으로 센 시각(ISO 8601). 센 적이 없으면 null이다. */
  lastCountedAt: z.iso.datetime().nullable(),
});

export type CounterValueDto = z.infer<typeof counterValueSchema>;

export const resetUndoSchema = z.object({
  totalBeforeReset: z.number().int().min(0),
  /** 리셋이 마지막으로 센 시각으로 저장한 시각. 되돌릴 수 있는지 판단할 때 쓴다. */
  resetAt: z.iso.datetime(),
});

export type ResetUndoDto = z.infer<typeof resetUndoSchema>;

export type ResetResultDto = { value: CounterValueDto; undo: ResetUndoDto };

export type RepeatPositionDto =
  | { kind: "NONE"; total: number }
  | { kind: "NOT_STARTED"; total: number }
  | { kind: "POSITION"; set: number; row: number; total: number };

export const counterSettingsSchema = z.object({
  sound: z.boolean().default(false),
  vibration: z.boolean().default(false),
  keepScreenOn: z.boolean().default(false),
});

export type CounterSettingsDto = z.infer<typeof counterSettingsSchema>;

export type CounterError = "INVALID_SET_SIZE" | "INVALID_STORED_VALUE" | "UNDO_EXPIRED";

export type CounterResult<T> = { ok: true; value: T } | { ok: false; error: CounterError };

/** 전체 단수를 1 올리고 마지막으로 센 시각을 now로 바꾼다. */
export function increment(value: CounterValueDto, now: string): CounterValueDto {
  return { ...value, total: value.total + 1, lastCountedAt: now };
}

/** 전체 단수를 1 내리고 마지막으로 센 시각을 now로 바꾼다. 전체 단수가 0이면 값을 바꾸지 않는다. */
export function decrement(value: CounterValueDto, now: string): CounterValueDto {
  if (value.total === 0) return value;
  return { ...value, total: value.total - 1, lastCountedAt: now };
}

/** 전체 단수를 0으로 바꾸고, 되돌리기에 쓸 리셋 전 값과 리셋 시각을 함께 돌려준다. */
export function reset(value: CounterValueDto, now: string): ResetResultDto {
  return {
    value: { ...value, total: 0, lastCountedAt: now },
    undo: { totalBeforeReset: value.total, resetAt: now },
  };
}

/**
 * 리셋 전 값으로 되돌린다. value는 저장소에서 다시 읽은 최신 값이다.
 * 리셋 뒤에 다른 탭에서 값이 바뀌었으면 그 값을 덮어쓰지 않도록 UNDO_EXPIRED로 실패한다.
 */
export function undoReset(value: CounterValueDto, undo: ResetUndoDto, now: string): CounterResult<CounterValueDto> {
  if (value.total !== 0 || value.lastCountedAt !== undo.resetAt) return { ok: false, error: "UNDO_EXPIRED" };
  return { ok: true, value: { ...value, total: undo.totalBeforeReset, lastCountedAt: now } };
}

/** 1세트당 단수를 바꾸거나(null이면) 지운다. 전체 단수와 마지막으로 센 시각은 그대로다. */
export function changeSetSize(value: CounterValueDto, setSize: number | null): CounterResult<CounterValueDto> {
  if (setSize !== null && !(Number.isInteger(setSize) && setSize >= 1)) return { ok: false, error: "INVALID_SET_SIZE" };
  return { ok: true, value: { ...value, setSize } };
}

/** 전체 단수를 'n세트 m단'으로 바꾼다. 요구사항 FR-25의 반복 표시 식을 따른다. */
export function getRepeatPosition(total: number, setSize: number | null): RepeatPositionDto {
  if (setSize === null) return { kind: "NONE", total };
  if (total === 0) return { kind: "NOT_STARTED", total };
  return { kind: "POSITION", set: Math.floor((total - 1) / setSize) + 1, row: ((total - 1) % setSize) + 1, total };
}

function parseStored<T>(raw: string, schema: z.ZodType<T>): CounterResult<T> {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, error: "INVALID_STORED_VALUE" };
  }
  const parsed = schema.safeParse(json);
  return parsed.success ? { ok: true, value: parsed.data } : { ok: false, error: "INVALID_STORED_VALUE" };
}

/** 브라우저 저장소에서 읽은 퀵 카운터 JSON 문자열을 검증한다. */
export function parseCounterValue(raw: string): CounterResult<CounterValueDto> {
  return parseStored(raw, counterValueSchema);
}

/** 브라우저 저장소에서 읽은 카운터 설정 JSON 문자열을 검증한다. 없는 항목은 꺼짐으로 채운다. */
export function parseCounterSettings(raw: string): CounterResult<CounterSettingsDto> {
  return parseStored(raw, counterSettingsSchema);
}
