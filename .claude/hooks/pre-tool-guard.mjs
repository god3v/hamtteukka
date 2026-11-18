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

  // 훅은 실행 전에 명령 문자열만 본다. 인용된 설명 속 git push도 명령으로 보는 쪽으로 틀리며, 이는 의도한 보수적 동작이다.
  // 서버 쪽 차단은 GitHub 브랜치 보호(R0 #5)가 맡는다.
  const segments = command.split(/&&|\|\||;|\||\r?\n/);
  const switchesBranch = segments.some((segment) => /\bgit\b(?:\s+-C\s+\S+)?\s+(?:switch|checkout)\b/.test(segment));
  for (const segment of segments) {
    const push = analyzePush(segment);
    if (!push) continue;
    if (push.target) {
      deny(`${push.target}에 직접 푸시하지 않는다. 작업 브랜치를 푸시하고 PR로 병합한다 (ADR-0013).`);
    }
    if (push.dependsOnCurrentBranch && switchesBranch) {
      deny("브랜치를 바꾸는 명령과 대상 브랜치를 생략한 git push를 한 호출에 함께 쓰지 않는다. 푸시 대상을 확인할 수 있도록 git push는 별도 호출로 실행하거나 브랜치 이름을 명시한다 (ADR-0013).");
    }
  }
}

const PROTECTED_BRANCHES = new Set(["main", "master", "dev"]);
// git push 옵션 가운데 다음 인수를 값으로 받는 것.
const PUSH_OPTIONS_WITH_VALUE = new Set(["-o", "--push-option", "--repo", "--receive-pack", "--exec"]);

function git(dir, gitArgs) {
  try {
    return execFileSync("git", gitArgs, { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

// 대상을 생략한 git push가 갱신할 원격 브랜치. push.default, upstream, remote.<name>.push 설정을 git이 계산한 값(@{push})을 쓴다.
function implicitPushBranch(dir) {
  const pushRef = git(dir, ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{push}"]);
  if (pushRef.includes("/")) return pushRef.slice(pushRef.indexOf("/") + 1);
  return git(dir, ["branch", "--show-current"]);
}

// git push 명령 한 토막을 해석한다. push가 아니면 null을 돌려준다.
// target: 갱신하는 보호 브랜치 이름(없으면 빈 문자열). dependsOnCurrentBranch: 대상이 실행 시점의 현재 브랜치에 달려 있는지.
function analyzePush(segment) {
  const tokens = segment.trim().split(/\s+/).map((token) => token.replace(/^["']|["']$/g, ""));
  const gitIndex = tokens.indexOf("git");
  if (gitIndex === -1) return null;

  let dir = input.cwd ?? process.cwd();
  let i = gitIndex + 1;
  for (; i < tokens.length && tokens[i] !== "push"; i += 1) {
    if (tokens[i] === "-C" && tokens[i + 1]) dir = path.resolve(dir, tokens[(i += 1)]);
    else if (!tokens[i].startsWith("-")) return null;
  }
  if (tokens[i] !== "push") return null;

  const positional = [];
  let tagsOnly = false;
  for (i += 1; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token === "--dry-run" || token === "-n") return { target: "", dependsOnCurrentBranch: false };
    if (token === "--all" || token === "--mirror" || token === "--branches") {
      return { target: "모든 브랜치(dev, main 포함)", dependsOnCurrentBranch: false };
    }
    if (token === "--tags") tagsOnly = true;
    if (PUSH_OPTIONS_WITH_VALUE.has(token)) i += 1;
    else if (!token.startsWith("-")) positional.push(token);
  }

  const refspecs = positional.slice(1);
  if (refspecs.length === 0) {
    if (tagsOnly) return { target: "", dependsOnCurrentBranch: false };
    const branch = implicitPushBranch(dir);
    return { target: PROTECTED_BRANCHES.has(branch) ? branch : "", dependsOnCurrentBranch: true };
  }

  let dependsOnCurrentBranch = false;
  for (const refspec of refspecs) {
    const spec = refspec.replace(/^\+/, "");
    if (spec === ":" || spec.includes("*")) {
      return { target: `대상을 확정할 수 없는 refspec(${refspec})으로 dev나 main`, dependsOnCurrentBranch: false };
    }
    let destination = spec.includes(":") ? spec.slice(spec.indexOf(":") + 1) : spec;
    if (destination === "HEAD" || destination === "@") {
      dependsOnCurrentBranch = true;
      destination = git(dir, ["branch", "--show-current"]);
    }
    destination = destination.replace(/^refs\/heads\//, "");
    if (PROTECTED_BRANCHES.has(destination)) return { target: destination, dependsOnCurrentBranch };
  }
  return { target: "", dependsOnCurrentBranch };
}

if (["Edit", "Write", "MultiEdit", "NotebookEdit"].includes(tool)) checkFileEdit();
if (tool === "Bash" || tool === "PowerShell") checkCommand();
process.exit(0);
