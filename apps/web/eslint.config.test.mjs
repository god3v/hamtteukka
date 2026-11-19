// apps/web의 ESLint 설정이 Supabase 패키지 import를 막는지 확인한다 (ADR-0003).
// Node 내장 테스트 러너로 실행한다: node --test
import assert from "node:assert/strict";
import { dirname } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";

const eslint = new ESLint({ cwd: dirname(fileURLToPath(import.meta.url)) });
const FILE_PATH = "app/example.ts";

// 예시 코드가 실제로 검사되었는지(무시되지 않았고 파싱 오류가 없는지) 확인한 뒤 ADR-0003 오류만 돌려준다.
async function supabaseErrors(code) {
  assert.equal(await eslint.isPathIgnored(FILE_PATH), false, `${FILE_PATH}가 ESLint 검사에서 제외되어 있다`);
  const [result] = await eslint.lintText(code, { filePath: FILE_PATH });
  const fatal = result.messages.filter((message) => message.fatal);
  assert.deepEqual(fatal, [], "예시 코드를 파싱하지 못했다");
  return result.messages.filter((message) => message.message.includes("ADR-0003"));
}

const blocked = [
  ["supabase-js import", `import { createClient } from "@supabase/supabase-js";\nexport const c = createClient;`],
  ["ssr import", `import { createServerClient } from "@supabase/ssr";\nexport const c = createServerClient;`],
  ["type import", `import type { SupabaseClient } from "@supabase/supabase-js";\nexport type C = SupabaseClient;`],
  ["하위 경로 import", `import x from "@supabase/supabase-js/dist/module/index.js";\nexport const c = x;`],
  ["export from", `export { createClient } from "@supabase/supabase-js";`],
  ["동적 import", `export const load = () => import("@supabase/supabase-js");`],
  ["require", `export const c = require("@supabase/ssr");`],
  ["템플릿 리터럴 동적 import", "export const load = () => import(`@supabase/supabase-js`);"],
  ["템플릿 리터럴 require", "export const c = require(`@supabase/ssr`);"],
];

for (const [name, code] of blocked) {
  test(`앱 코드에서 Supabase 패키지 ${name}를 막는다`, async () => {
    const errors = await supabaseErrors(code);
    assert.equal(errors.length, 1, `오류 1개를 기대했지만 ${errors.length}개다`);
    assert.equal(errors[0].severity, 2);
  });
}

test("앱 코드에서 @hamtteukka/shared import는 허용한다", async () => {
  const errors = await supabaseErrors(`import { appInfo } from "@hamtteukka/shared";\nexport const a = appInfo;`);
  assert.equal(errors.length, 0);
});

test("경로를 조합하는 동적 import는 검사하지 않는다", async () => {
  const errors = await supabaseErrors("const pkg = \"supabase-js\";\nexport const load = () => import(`@supabase/${pkg}`);");
  assert.equal(errors.length, 0);
});

test("파싱할 수 없는 예시 코드는 허용 테스트에서도 실패로 드러난다", async () => {
  await assert.rejects(supabaseErrors("import {"), /파싱하지 못했다/);
});

test("이름이 비슷한 다른 패키지는 막지 않는다", async () => {
  const errors = await supabaseErrors(`import x from "supabase-helpers";\nexport const a = x;`);
  assert.equal(errors.length, 0);
});
