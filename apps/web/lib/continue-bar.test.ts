// 이어서 뜨기 바를 보여 줄지 정하는 규칙을 확인한다. Node 내장 테스트 러너로 실행한다: node --test
import assert from "node:assert/strict";
import { test } from "node:test";

import { isEditableElement, shouldShowContinueBar } from "./continue-bar.ts";

const COUNTED = "2026-11-24T10:00:00.000Z";

test("003/AC-36 퀵 카운터로 센 적이 없으면 내 정보 탭에서도 바를 숨긴다", () => {
  assert.equal(shouldShowContinueBar({ pathname: "/me", lastCountedAt: null, keyboardOpen: false }), false);
});

test("003/AC-36 로그아웃 홈에서는 퀵 카운터 구역이 값을 이미 보여 주므로 바를 숨긴다", () => {
  assert.equal(shouldShowContinueBar({ pathname: "/", lastCountedAt: COUNTED, keyboardOpen: false }), false);
});

test("003/AC-36 센 적이 있으면 내 정보 탭과 고객 지원 화면에서 바를 보여 준다", () => {
  assert.equal(shouldShowContinueBar({ pathname: "/me", lastCountedAt: COUNTED, keyboardOpen: false }), true);
  assert.equal(shouldShowContinueBar({ pathname: "/support", lastCountedAt: COUNTED, keyboardOpen: false }), true);
});

test("003/AC-36 퀵 카운터 화면과 화면 키보드가 열린 동안에는 바를 숨긴다", () => {
  assert.equal(shouldShowContinueBar({ pathname: "/quick-counter", lastCountedAt: COUNTED, keyboardOpen: false }), false);
  assert.equal(shouldShowContinueBar({ pathname: "/me", lastCountedAt: COUNTED, keyboardOpen: true }), false);
});

test("003/AC-36 글자를 입력하는 요소에 포커스가 있을 때만 화면 키보드가 열린 것으로 본다", () => {
  assert.equal(isEditableElement({ tagName: "TEXTAREA" }), true);
  assert.equal(isEditableElement({ tagName: "INPUT", type: "text" }), true);
  assert.equal(isEditableElement({ tagName: "INPUT", type: "search" }), true);
  assert.equal(isEditableElement({ tagName: "DIV", isContentEditable: true }), true);
  assert.equal(isEditableElement({ tagName: "INPUT", type: "radio" }), false);
  assert.equal(isEditableElement({ tagName: "INPUT", type: "checkbox" }), false);
  assert.equal(isEditableElement({ tagName: "BUTTON" }), false);
  assert.equal(isEditableElement(null), false);
});
