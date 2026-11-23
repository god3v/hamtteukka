import { describe, expect, it } from "vitest";

import {
  changeSetSize,
  decrement,
  getRepeatPosition,
  increment,
  parseCounterSettings,
  parseCounterValue,
  reset,
  undoReset,
  type CounterValueDto,
} from "./counter-core";

const T0 = "2026-11-23T10:00:00.000Z";
const T1 = "2026-11-23T10:05:00.000Z";
const T2 = "2026-11-23T10:10:00.000Z";

function counter(total: number, setSize: number | null = null, lastCountedAt: string | null = T0): CounterValueDto {
  return { total, setSize, lastCountedAt };
}

describe("increment, decrement", () => {
  it("더하기는 전체 단수를 1 올리고 마지막으로 센 시각을 바꾼다", () => {
    expect(increment(counter(12), T1)).toEqual(counter(13, null, T1));
  });

  it("003/AC-03 값이 0일 때 빼기는 값과 마지막으로 센 시각을 바꾸지 않는다", () => {
    const value = counter(0, 4, T0);

    const result = decrement(value, T1);

    expect(result).toEqual(value);
  });

  it("빼기는 전체 단수를 1 내리고 마지막으로 센 시각을 바꾼다", () => {
    expect(decrement(counter(13), T1)).toEqual(counter(12, null, T1));
  });

  it("003/AC-10 더하기를 빠르게 5번 적용하면 누른 횟수만큼 늘어난다", () => {
    let value = counter(10);

    for (let i = 0; i < 5; i++) value = increment(value, T1);

    expect(value.total).toBe(15);
  });
});

describe("reset, undoReset", () => {
  it("003/AC-05 리셋하면 전체 단수가 0이 되고 리셋 전 값을 되돌리기 정보로 남긴다", () => {
    const result = reset(counter(40, 4), T1);

    expect(result.value).toEqual(counter(0, 4, T1));
    expect(result.undo).toEqual({ totalBeforeReset: 40, resetAt: T1 });
  });

  it("003/AC-06 리셋 직후 되돌리면 리셋 전 값으로 돌아간다", () => {
    const { value, undo } = reset(counter(40, 4), T1);

    const result = undoReset(value, undo, T2);

    expect(result).toEqual({ ok: true, value: counter(40, 4, T2) });
  });

  it("003/AC-06 리셋 뒤 다른 탭에서 값이 바뀌었으면 UNDO_EXPIRED로 되돌리지 않는다", () => {
    const { value, undo } = reset(counter(40), T1);
    const changedInOtherTab = increment(value, T2);

    expect(undoReset(changedInOtherTab, undo, T2)).toEqual({ ok: false, error: "UNDO_EXPIRED" });
  });

  it("003/AC-06 다른 탭이 같은 0을 다른 시각에 저장했어도 UNDO_EXPIRED로 본다", () => {
    const { undo } = reset(counter(40), T1);

    expect(undoReset(counter(0, null, T2), undo, T2)).toEqual({ ok: false, error: "UNDO_EXPIRED" });
  });
});

describe("getRepeatPosition", () => {
  it.each([
    [1, 1, 1],
    [4, 1, 4],
    [5, 2, 1],
    [6, 2, 2],
  ])("003/AC-21 1세트당 단수가 4일 때 전체 단수 %i는 %i세트 %i단이다", (total, set, row) => {
    expect(getRepeatPosition(total, 4)).toEqual({ kind: "POSITION", set, row, total });
  });

  it("003/AC-21 전체 단수 5에서 더하기를 누르면 2세트 2단과 전체 단수 6을 보여 준다", () => {
    const value = increment(counter(5, 4), T1);

    expect(getRepeatPosition(value.total, value.setSize)).toEqual({ kind: "POSITION", set: 2, row: 2, total: 6 });
  });

  it("전체 단수가 0이면 시작 전으로 표시한다", () => {
    expect(getRepeatPosition(0, 4)).toEqual({ kind: "NOT_STARTED", total: 0 });
  });

  it("1세트당 단수가 없으면 전체 단수만 표시한다", () => {
    expect(getRepeatPosition(8, null)).toEqual({ kind: "NONE", total: 8 });
  });
});

describe("changeSetSize", () => {
  it("003/AC-22 1세트당 단수를 지워도 전체 단수는 그대로다", () => {
    const result = changeSetSize(counter(8, 4), null);

    expect(result).toEqual({ ok: true, value: counter(8, null) });
  });

  it("1세트당 단수를 바꿔도 전체 단수와 마지막으로 센 시각은 그대로다", () => {
    expect(changeSetSize(counter(8, 4), 6)).toEqual({ ok: true, value: counter(8, 6) });
  });

  it.each([0, -1, 1.5, Number.NaN])("1세트당 단수 %s는 INVALID_SET_SIZE로 거부한다", (setSize) => {
    expect(changeSetSize(counter(8, 4), setSize)).toEqual({ ok: false, error: "INVALID_SET_SIZE" });
  });
});

describe("parseCounterValue", () => {
  it("저장된 JSON을 CounterValueDto로 읽는다", () => {
    const raw = JSON.stringify({ total: 7, setSize: 4, lastCountedAt: T0 });

    expect(parseCounterValue(raw)).toEqual({ ok: true, value: counter(7, 4, T0) });
  });

  it("센 적이 없는 값은 1세트당 단수와 마지막으로 센 시각이 비어 있다", () => {
    const raw = JSON.stringify({ total: 0, setSize: null, lastCountedAt: null });

    expect(parseCounterValue(raw)).toEqual({ ok: true, value: counter(0, null, null) });
  });

  it.each([
    ["JSON이 아닌 값", "not json"],
    ["음수 전체 단수", JSON.stringify({ total: -1, setSize: null, lastCountedAt: null })],
    ["소수 전체 단수", JSON.stringify({ total: 1.5, setSize: null, lastCountedAt: null })],
    ["0인 1세트당 단수", JSON.stringify({ total: 3, setSize: 0, lastCountedAt: null })],
    ["시각 형식이 아닌 값", JSON.stringify({ total: 3, setSize: null, lastCountedAt: "어제" })],
    ["빠진 항목", JSON.stringify({ total: 3 })],
  ])("%s는 INVALID_STORED_VALUE로 거부한다", (_name, raw) => {
    expect(parseCounterValue(raw)).toEqual({ ok: false, error: "INVALID_STORED_VALUE" });
  });
});

describe("parseCounterSettings", () => {
  it("저장된 설정을 읽고 없는 항목은 꺼짐으로 채운다", () => {
    expect(parseCounterSettings(JSON.stringify({ sound: true }))).toEqual({
      ok: true,
      value: { sound: true, vibration: false, keepScreenOn: false },
    });
  });

  it.each([
    ["JSON이 아닌 값", "{"],
    ["참거짓이 아닌 값", JSON.stringify({ sound: "켜짐" })],
    ["객체가 아닌 값", JSON.stringify([true])],
  ])("%s는 INVALID_STORED_VALUE로 거부한다", (_name, raw) => {
    expect(parseCounterSettings(raw)).toEqual({ ok: false, error: "INVALID_STORED_VALUE" });
  });
});
