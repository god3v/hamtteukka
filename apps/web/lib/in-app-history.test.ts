// 앱 안에서 화면을 옮긴 기록을 확인한다. Node 내장 테스트 러너로 실행한다: node --test
import assert from "node:assert/strict";
import { test } from "node:test";

import { createInAppHistory } from "./in-app-history.ts";

test("주소로 바로 들어온 첫 화면에서는 돌아갈 앱 화면이 없다", () => {
  const history = createInAppHistory();

  history.record("/quick-counter");

  assert.equal(history.canGoBack(), false);
});

test("같은 경로를 다시 기록해도 화면을 옮긴 것으로 보지 않는다", () => {
  const history = createInAppHistory();

  history.record("/");
  history.record("/");

  assert.equal(history.canGoBack(), false);
});

test("앱 안에서 다른 화면으로 옮기면 돌아갈 화면이 있다", () => {
  const history = createInAppHistory();

  history.record("/");
  history.record("/quick-counter");

  assert.equal(history.canGoBack(), true);
});
