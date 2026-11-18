// PreToolUse hook: denies file edits and shell commands that break the rules in AGENTS.md.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { locate, readHookInput } from "./hook-utils.mjs";

const input = readHookInput();
const tool = input.tool_name ?? "";
const args = input.tool_input ?? {};

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: `[하네스] ${reason}`,
      },
    }),
  );
  process.exit(0);
}

function checkFileEdit() {
  const target = locate(args.file_path ?? args.notebook_path);
  if (!target) return;
  const { rel, abs } = target;
  const name = path.basename(rel);

  const createsNewFile = tool === "Write" && !existsSync(abs);
  if (/^docs\/research\/.+\.md$/i.test(rel) && !createsNewFile) {
    deny(
      "docs/research/ 문서는 조사 시점의 기록이라 고쳐 쓰지 않는다. 새 사실은 docs/research/YYYY-MM-DD-<주제>.md 새 문서로 남긴다 (AGENTS.md 문서 작성 규칙).",
    );
  }
  if ((name === ".env" || name.startsWith(".env.")) && name !== ".env.example") {
    deny(
      "비밀 값 파일(.env, .env.*)은 에이전트가 만들거나 고치지 않는다 (헌법 P-10). 필요한 키 이름은 .env.example에 적고, 실제 값은 사용자에게 넣어 달라고 요청한다.",
    );
  }
  if (name === "pnpm-lock.yaml") {
    deny("pnpm-lock.yaml은 직접 고치지 않는다. pnpm install이나 pnpm add로 바꾼다.");
  }
}

// A check command at the start of a command segment, e.g. `pnpm test`, `pnpm --filter x lint`, `npx vitest run`.
const CHECK_COMMAND =
  /^\s*(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)*(?:(?:pnpm|npm|npx|yarn|bun)\s+(?:(?:run|exec|-r|--recursive|-w|--workspace-root|(?:--filter|-F)\s+\S+)\s+)*(?:typecheck|lint|test|build|tsc|eslint|vitest|turbo|next\s+build)\b|(?:tsc|eslint|vitest|turbo|next\s+build)\b)/i;

function checkCommand() {
  const command = String(args.command ?? "");
  if (!command) return;

  if (!/pipefail/.test(command)) {
    const segments = command.split(/&&|\|\||;|\r?\n/);
    for (const segment of segments) {
      if (CHECK_COMMAND.test(segment) && /\|/.test(segment)) {
        deny(
          "검사 명령(typecheck, lint, test, build)의 출력을 파이프로 넘기면 실패 종료 코드가 가려진다 (헌법 P-09). 출력을 그대로 보거나, 파일로 저장한 뒤 종료 코드와 함께 확인한다. 예: pnpm test > test.log 2>&1; echo $?",
        );
      }
    }
  }

  if (/\bgit\b[^\n;&|]*\s--no-verify\b/.test(command)) {
    deny("git 훅을 --no-verify로 건너뛰지 않는다. 훅이 지적한 원인을 고친다.");
  }

  for (const segment of command.split(/&&|\|\||;|\||\r?\n/)) {
    const target = protectedPushTarget(segment);
    if (target) {
      deny(`${target}에 직접 푸시하지 않는다. 작업 브랜치를 푸시하고 PR로 병합한다 (ADR-0013).`);
    }
  }
}

const PROTECTED_BRANCHES = new Set(["main", "master", "dev"]);
// git push 옵션 가운데 다음 인수를 값으로 받는 것.
const PUSH_OPTIONS_WITH_VALUE = new Set(["-o", "--push-option", "--repo", "--receive-pack", "--exec"]);

function currentBranch(dir) {
  try {
    return execFileSync("git", ["branch", "--show-current"], { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

// git push 명령 한 토막이 보호 브랜치를 갱신하면 그 브랜치 이름을, 아니면 빈 문자열을 돌려준다.
// 명시한 refspec(`HEAD:refs/heads/dev`, `+dev`, `:dev`)과 대상을 생략한 `git push`(현재 브랜치를 푸시)를 모두 확인한다.
function protectedPushTarget(segment) {
  const tokens = segment.trim().split(/\s+/).map((token) => token.replace(/^["']|["']$/g, ""));
  const gitIndex = tokens.indexOf("git");
  if (gitIndex === -1) return "";

  let dir = input.cwd ?? process.cwd();
  let i = gitIndex + 1;
  for (; i < tokens.length && tokens[i] !== "push"; i += 1) {
    if (tokens[i] === "-C" && tokens[i + 1]) dir = path.resolve(dir, tokens[(i += 1)]);
    else if (!tokens[i].startsWith("-")) return "";
  }
  if (tokens[i] !== "push") return "";

  const positional = [];
  for (i += 1; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token === "--all" || token === "--mirror" || token === "--branches") return "모든 브랜치(dev, main 포함)";
    if (PUSH_OPTIONS_WITH_VALUE.has(token)) i += 1;
    else if (!token.startsWith("-")) positional.push(token);
  }

  const refspecs = positional.slice(1);
  if (refspecs.length === 0) refspecs.push("HEAD");
  for (const refspec of refspecs) {
    const spec = refspec.replace(/^\+/, "");
    let destination = spec.includes(":") ? spec.slice(spec.indexOf(":") + 1) : spec;
    if (destination === "HEAD" || destination === "@") destination = currentBranch(dir);
    destination = destination.replace(/^refs\/heads\//, "");
    if (PROTECTED_BRANCHES.has(destination)) return destination;
  }
  return "";
}

if (["Edit", "Write", "MultiEdit", "NotebookEdit"].includes(tool)) checkFileEdit();
if (tool === "Bash" || tool === "PowerShell") checkCommand();
process.exit(0);
