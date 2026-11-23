// 카운터 화면에 보이는 단수, 반복 위치, 마지막으로 센 시각 문구를 확인한다. Node 내장 테스트 러너로 실행한다: node --test
import assert from "node:assert/strict";
import { test } from "node:test";

import { getRepeatPosition } from "@hamtteukka/shared";

import { formatLastCounted, formatRepeatPosition, formatRows } from "./counter-format.ts";

const now = new Date(2026, 10, 23, 15, 30, 0);
const at = (month: number, day: number, hour: number, minute: number) =>
  new Date(2026, month - 1, day, hour, minute, 0).toISOString();

test("단수는 숫자 뒤에 단을 붙인다", () => {
  assert.equal(formatRows(45), "45단");
});

test("1세트당 단수가 있으면 n세트 m단으로, 전체 단수가 0이면 시작 전으로 쓴다", () => {
  assert.equal(formatRepeatPosition(getRepeatPosition(6, 4)), "2세트 2단");
  assert.equal(formatRepeatPosition(getRepeatPosition(0, 4)), "시작 전");
});

test("1세트당 단수가 없으면 반복 위치를 쓰지 않는다", () => {
  assert.equal(formatRepeatPosition(getRepeatPosition(6, null)), null);
});

test("마지막으로 센 시각을 지난 시각 표기로 쓴다", () => {
  assert.equal(formatLastCounted(null, now), "아직 세지 않았어요.");
  assert.equal(formatLastCounted(new Date(now.getTime() - 10_000).toISOString(), now), "방금 셌어요.");
  assert.equal(formatLastCounted(at(11, 23, 15, 27), now), "3분 전에 셌어요.");
  assert.equal(formatLastCounted(at(11, 22, 21, 0), now), "어제 셌어요.");
  assert.equal(formatLastCounted(at(11, 2, 9, 0), now), "11월 2일에 셌어요.");
});
