#!/usr/bin/env node
// Supabase 로컬 스택을 127.0.0.1에만 포트를 여는 Docker 네트워크에서 실행한다.
// Supabase CLI는 기본으로 포트를 0.0.0.0에 열어 같은 네트워크의 다른 기기가 Studio와 DB에 접속할 수 있다.
// 사용: node scripts/supabase-local.mjs <start|reset> [supabase 옵션...]
import { spawnSync } from "node:child_process";

const NETWORK = "hamtteukka-local";
const COMMANDS = { start: ["start"], reset: ["db", "reset"] };

const [command, ...extraArgs] = process.argv.slice(2);
if (!COMMANDS[command]) {
  console.error("사용법: node scripts/supabase-local.mjs <start|reset> [supabase 옵션...]");
  process.exit(2);
}

const isWindows = process.platform === "win32";

function run(bin, args, options = {}) {
  return spawnSync(bin, args, { stdio: "inherit", shell: isWindows, ...options });
}

const inspect = run("docker", ["network", "inspect", NETWORK], { stdio: "ignore" });
if (inspect.error) {
  console.error("docker를 실행할 수 없다. Docker Desktop이 설치되어 있고 실행 중인지 확인한다.");
  process.exit(1);
}
if (inspect.status !== 0) {
  const create = run("docker", [
    "network",
    "create",
    "-o",
    "com.docker.network.bridge.host_binding_ipv4=127.0.0.1",
    NETWORK,
  ]);
  if (create.status !== 0) {
    console.error(`Docker 네트워크 ${NETWORK}를 만들지 못했다. Docker Desktop이 실행 중인지 확인한다.`);
    process.exit(create.status ?? 1);
  }
}

const result = run("supabase", [...COMMANDS[command], "--network-id", NETWORK, ...extraArgs]);
process.exit(result.status ?? 1);
