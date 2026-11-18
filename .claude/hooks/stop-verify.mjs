// Stop hook: before Claude finishes a response, runs the checks that match what changed in the working tree.
//   - code changed (apps/, packages/, supabase/, workspace config) -> turbo typecheck, lint, test
//   - docs/**/*.md changed -> scripts/check-docs.mjs
//   - Markdown changed -> korean-refine checker with --style plain, when the checker is installed
// On failure it exits 2 so Claude keeps working once. The same working-tree state is checked only once per session.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { checkDoc } from "../../scripts/check-docs.mjs";
import { findRepoRoot, isThisRepo, readHookInput } from "./hook-utils.mjs";

const input = readHookInput();
if (input.stop_hook_active) process.exit(0);

const root = findRepoRoot(input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd());
if (!isThisRepo(root)) process.exit(0);

const isWindows = process.platform === "win32";

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    encoding: "utf8",
    shell: isWindows,
    maxBuffer: 64 * 1024 * 1024,
    ...options,
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.replace(/\u001b\[[0-9;]*m/g, "");
  return { status: result.status ?? 1, output, error: result.error };
}

function lastLines(text, count) {
  const lines = text.trim().split(/\r?\n/);
  return lines.length > count ? [`(앞부분 ${lines.length - count}줄 생략)`, ...lines.slice(-count)].join("\n") : lines.join("\n");
}

const status = run("git", ["-c", "core.quotepath=false", "status", "--porcelain=v1", "--untracked-files=all"]);
if (status.status !== 0) process.exit(0);

const changed = status.output
  .split(/\r?\n/)
  .filter((line) => line.length > 3 && line[0] !== "D" && line[1] !== "D")
  .map((line) => line.slice(3).split(" -> ").pop().replace(/^"|"$/g, ""));
if (changed.length === 0) process.exit(0);

const fingerprint = createHash("sha1")
  .update(status.output)
  .update(
    changed
      .map((rel) => {
        const abs = path.join(root, rel);
        return existsSync(abs) ? `${rel}:${statSync(abs).mtimeMs}:${statSync(abs).size}` : rel;
      })
      .join("\n"),
  )
  .digest("hex");
const statePath = path.join(os.tmpdir(), `hamtteukka-stop-${String(input.session_id ?? "nosession").replace(/[^\w-]/g, "")}.json`);
try {
  if (JSON.parse(readFileSync(statePath, "utf8")).fingerprint === fingerprint) process.exit(0);
} catch {
  // No state yet for this session.
}
writeFileSync(statePath, JSON.stringify({ fingerprint }));

const sections = [];

const CODE_PATH = /^(?:apps|packages|supabase)\/|^(?:package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|turbo\.json|tsconfig\.base\.json)$/;
if (changed.some((rel) => CODE_PATH.test(rel))) {
  if (!existsSync(path.join(root, "node_modules"))) {
    sections.push("## typecheck, lint, test\n의존성이 설치되지 않아 검사를 실행하지 못했다. pnpm install 뒤 pnpm typecheck, pnpm lint, pnpm test를 실행한다.");
  } else {
    const checks = run("pnpm", ["exec", "turbo", "run", "typecheck", "lint", "test", "--continue", "--output-logs=errors-only"]);
    if (checks.status !== 0) {
      sections.push(
        `## typecheck, lint, test (종료 코드 ${checks.status})\n전체 출력은 pnpm typecheck, pnpm lint, pnpm test를 직접 실행해 확인한다.\n\n${lastLines(checks.output, 80)}`,
      );
    }
  }
}

const docs = changed.filter((rel) => /^docs\/.+\.md$/i.test(rel));
const docProblems = docs.flatMap((rel) => {
  const problems = checkDoc(readFileSync(path.join(root, rel), "utf8"));
  return problems.length > 0 ? [rel, ...problems.map((problem) => `  - ${problem}`)] : [];
});
if (docProblems.length > 0) {
  sections.push(`## 문서 구조 검사 (node scripts/check-docs.mjs)\n${docProblems.join("\n")}`);
}

const prose = changed.filter((rel) => /\.md$/i.test(rel) && (/^docs\//i.test(rel) || !rel.includes("/")));
const refineCandidates = [
  path.join(root, ".claude", "skills", "korean-refine", "scripts", "korean-refine-lint.mjs"),
  path.join(os.homedir(), ".claude", "skills", "korean-refine", "scripts", "korean-refine-lint.mjs"),
];
const refineLint = refineCandidates.find((candidate) => existsSync(candidate));
if (prose.length > 0 && refineLint) {
  const refine = run(process.execPath, [refineLint, "--style", "plain", ...prose], { shell: false });
  if (refine.status !== 0) {
    sections.push(`## korean-refine (--style plain, 종료 코드 ${refine.status})\n${lastLines(refine.output, 60)}`);
  }
}

if (sections.length === 0) process.exit(0);

const header = [
  "[하네스] 응답을 마치기 전에 실행한 검사에서 문제가 나왔다. 문제를 고친 뒤 검사를 다시 실행한다.",
  "이번 작업과 무관한 문제이거나 고치지 않기로 한 항목은, 실패 출력과 이유를 사용자에게 그대로 보고한다.",
].join("\n");
process.stderr.write(`${[header, ...sections].join("\n\n")}\n`);
process.exit(2);
