// PostToolUse hook: checks a file right after Claude edits it and reports problems back to Claude.
// Exit code 2 shows stderr to Claude; the edit itself has already happened.

import { existsSync, readFileSync } from "node:fs";
import { checkDoc } from "../../scripts/check-docs.mjs";
import { locate, readHookInput } from "./hook-utils.mjs";

const input = readHookInput();
const target = locate(input.tool_input?.file_path);
if (!target || !existsSync(target.abs)) process.exit(0);

const { rel, abs } = target;
const messages = [];

if (/^docs\/.+\.md$/i.test(rel)) {
  const problems = checkDoc(readFileSync(abs, "utf8"));
  if (problems.length > 0) {
    messages.push(
      `${rel} 문서 구조 검사에서 문제가 나왔다 (AGENTS.md 문서 작성 규칙).`,
      ...problems.map((problem) => `- ${problem}`),
    );
  }
}

const SUPABASE_IMPORT =
  /(?:from\s+|import\s*\(\s*|require\s*\(\s*|import\s+)["']@supabase\/(?:supabase-js|ssr)(?:\/[^"']*)?["']/;
if (/^apps\/.+\.[cm]?[jt]sx?$/i.test(rel) && SUPABASE_IMPORT.test(readFileSync(abs, "utf8"))) {
  messages.push(
    `${rel}: apps/에서는 @supabase/supabase-js와 @supabase/ssr을 import하지 않는다 (ADR-0003). packages/shared에 함수를 만들고 앱은 그 함수를 호출한다.`,
  );
}

if (messages.length > 0) {
  process.stderr.write(`[하네스] ${messages.join("\n")}\n`);
  process.exit(2);
}
process.exit(0);
