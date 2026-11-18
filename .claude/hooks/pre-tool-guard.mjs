// PreToolUse hook: denies file edits and shell commands that break the rules in AGENTS.md.

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

  if (/\bgit\s+push\b[^\n;&|]*?[\s:+](?:main|master)(?=$|[\s;&|])/.test(command)) {
    deny("main에 직접 푸시하지 않는다. 작업 브랜치를 푸시하고 PR로 병합한다.");
  }
}

if (["Edit", "Write", "MultiEdit", "NotebookEdit"].includes(tool)) checkFileEdit();
if (tool === "Bash" || tool === "PowerShell") checkCommand();
process.exit(0);
