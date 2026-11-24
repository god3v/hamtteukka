import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // server-only는 react-server 조건이 없는 환경에서 import하면 오류를 낸다.
      // Next.js 밖에서 실행하는 단위 테스트는 서버 환경이므로 빈 모듈로 바꾼다.
      "server-only": fileURLToPath(new URL("./src/testing/server-only-stub.ts", import.meta.url)),
    },
  },
});
