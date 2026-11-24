// 지난 시각 표기를 확인한다. docs/design/brand.md의 '숫자와 날짜' 표를 따른다. Node 내장 테스트 러너로 실행한다: node --test
import assert from "node:assert/strict";
import { test } from "node:test";

import { formatElapsed } from "./elapsed-time.ts";

// 기기의 시간대와 상관없이 같은 결과가 나오도록 현지 시각으로 날짜를 만든다.
const now = new Date(2026, 10, 23, 15, 30, 0);
const at = (month: number, day: number, hour: number, minute: number, year = 2026) =>
  new Date(year, month - 1, day, hour, minute, 0).toISOString();

test("1분 안은 방금, 1시간 안은 n분 전으로 쓴다", () => {
  assert.equal(formatElapsed(new Date(now.getTime() - 30_000).toISOString(), now), "방금");
  assert.equal(formatElapsed(at(11, 23, 15, 29), now), "1분 전");
  assert.equal(formatElapsed(at(11, 23, 15, 27), now), "3분 전");
  assert.equal(formatElapsed(at(11, 23, 14, 31), now), "59분 전");
});

test("오늘 1시간이 넘게 지났으면 n시간 전으로 쓴다", () => {
  assert.equal(formatElapsed(at(11, 23, 14, 30), now), "1시간 전");
  assert.equal(formatElapsed(at(11, 23, 0, 5), now), "15시간 전");
});

test("어제는 어제, 7일 안은 n일 전으로 쓴다", () => {
  assert.equal(formatElapsed(at(11, 22, 23, 50), now), "어제");
  assert.equal(formatElapsed(at(11, 20, 9, 0), now), "3일 전");
  assert.equal(formatElapsed(at(11, 17, 9, 0), now), "6일 전");
});

test("7일보다 오래되면 날짜로 쓰고, 다른 해는 연도를 붙인다", () => {
  assert.equal(formatElapsed(at(11, 2, 9, 0), now), "11월 2일");
  assert.equal(formatElapsed(at(3, 8, 9, 0, 2025), now), "2025년 3월 8일");
});

test("시계가 어긋나 미래 시각이 오면 방금으로 쓴다", () => {
  assert.equal(formatElapsed(at(11, 23, 15, 40), now), "방금");
});
