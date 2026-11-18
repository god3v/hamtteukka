#!/usr/bin/env node
// Supabase 로컬 스택을 127.0.0.1에만 포트를 여는 Docker 네트워크에서 실행한다.
// Supabase CLI는 기본으로 포트를 0.0.0.0에 열어 같은 네트워크의 다른 기기가 Studio와 DB에 접속할 수 있다.
// 사용: node scripts/supabase-local.mjs <start|reset> [supabase 옵션...]
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const NETWORK = "hamtteukka-local";
const BIND_OPTION = "com.docker.network.bridge.host_binding_ipv4";
const BIND_ADDRESS = "127.0.0.1";
const COMMANDS = { start: ["start"], reset: ["db", "reset"] };

const [command, ...extraArgs] = process.argv.slice(2);
if (!Object.hasOwn(COMMANDS, command)) {
  console.error("사용법: node scripts/supabase-local.mjs <start|reset> [supabase 옵션...]");
  process.exit(2);
}

// 셸을 거치지 않고 실행해 인수 경계를 그대로 전달한다. Windows에서도 docker는 docker.exe로 바로 실행된다.
function run(bin, args, options = {}) {
  return spawnSync(bin, args, { stdio: "inherit", shell: false, ...options });
}

const inspect = run("docker", ["network", "inspect", NETWORK, "--format", `{{.Driver}} {{index .Options "${BIND_OPTION}"}}`], {
  stdio: ["ignore", "pipe", "ignore"],
  encoding: "utf8",
});
if (inspect.error) {
  console.error("docker를 실행할 수 없다. Docker Desktop이 설치되어 있고 실행 중인지 확인한다.");
  process.exit(1);
}

// Docker Engine 28.0.0 미만은 127.0.0.1에 게시한 포트도 같은 L2 구간의 다른 기기가 접근할 수 있다.
const version = run("docker", ["version", "--format", "{{.Server.Version}}"], {
  stdio: ["ignore", "pipe", "ignore"],
  encoding: "utf8",
});
const major = Number.parseInt(version.stdout ?? "", 10);
if (Number.isInteger(major) && major < 28) {
  console.warn(
    `경고: Docker Engine ${version.stdout.trim()}은 127.0.0.1 바인딩만으로 LAN 접근을 완전히 막지 못한다. Docker Engine 28.0.0 이상으로 업데이트한다.`,
  );
}

if (inspect.status === 0) {
  // 같은 이름의 네트워크를 스크립트 밖에서 만들었다면 바인딩 옵션이 없을 수 있다. 자동으로 지우지 않고 멈춘다.
  const [driver, address] = inspect.stdout.trim().split(" ");
  if (driver !== "bridge" || address !== BIND_ADDRESS) {
    console.error(
      `Docker 네트워크 ${NETWORK}가 포트를 ${BIND_ADDRESS}에만 열도록 설정되어 있지 않다 (드라이버: ${driver || "없음"}, ${BIND_OPTION}: ${address || "없음"}).`,
    );
    console.error(`pnpm db:stop 뒤 docker network rm ${NETWORK}로 지우고 다시 실행한다.`);
    process.exit(1);
  }
} else {
  const create = run("docker", ["network", "create", "-o", `${BIND_OPTION}=${BIND_ADDRESS}`, NETWORK]);
  if (create.status !== 0) {
    console.error(`Docker 네트워크 ${NETWORK}를 만들지 못했다. Docker Desktop이 실행 중인지 확인한다.`);
    process.exit(create.status ?? 1);
  }
}

// supabase 패키지의 실행 파일은 Node 스크립트이므로 현재 Node로 직접 실행한다. Windows의 .cmd 래퍼를 거치지 않는다.
const require = createRequire(import.meta.url);
const supabaseBin = join(dirname(require.resolve("supabase/package.json")), "dist", "supabase.js");
const result = run(process.execPath, [supabaseBin, ...COMMANDS[command], "--network-id", NETWORK, ...extraArgs]);
process.exit(result.status ?? 1);
