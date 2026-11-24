// 하단 탭의 활성 탭 규칙을 확인한다. Node 내장 테스트 러너로 실행한다: node --test
import assert from "node:assert/strict";
import { test } from "node:test";

import { BOTTOM_TABS, findActiveTab, isSheetScreen } from "./navigation.ts";

test("R0 하단 탭은 홈과 내 정보를 이 순서로 보여 준다", () => {
  assert.deepEqual(
    BOTTOM_TABS.map((tab) => tab.label),
    ["홈", "내 정보"],
  );
});

test("홈 탭은 첫 화면에서만 활성이다", () => {
  assert.equal(findActiveTab("/")?.id, "home");
  assert.notEqual(findActiveTab("/me")?.id, "home");
});

test("고객 지원 화면에서는 내 정보 탭이 활성이다", () => {
  assert.equal(findActiveTab("/me")?.id, "me");
  assert.equal(findActiveTab("/me/settings")?.id, "me");
  assert.equal(findActiveTab("/support")?.id, "me");
});

test("이름만 비슷한 경로는 탭에 속하지 않는다", () => {
  assert.equal(findActiveTab("/members"), undefined);
  assert.equal(findActiveTab("/supporters"), undefined);
});

test("퀵 카운터 화면처럼 전체 높이 시트로 여는 화면에서는 하단 탭을 숨긴다", () => {
  assert.equal(isSheetScreen("/quick-counter"), true);
  assert.equal(isSheetScreen("/"), false);
  assert.equal(isSheetScreen("/me"), false);
  assert.equal(isSheetScreen("/quick-counters"), false);
});
