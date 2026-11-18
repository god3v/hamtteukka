import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// ADR-0003: Supabase 클라이언트(@supabase/*)는 packages/shared 안에서만 쓴다. 앱은 @hamtteukka/shared 함수만 호출한다.
const SUPABASE_MESSAGE =
  "Supabase 패키지는 packages/shared 안에서만 import한다. @hamtteukka/shared의 함수를 호출한다 (ADR-0003).";
const SUPABASE_SOURCE = "/^@supabase\\//";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // import 문과 export ... from 문, import type 문을 막는다. 하위 경로(@supabase/ssr/dist/...)도 포함한다.
      "no-restricted-imports": ["error", { patterns: [{ regex: "^@supabase/", message: SUPABASE_MESSAGE }] }],
      // no-restricted-imports가 보지 않는 동적 import()와 require()를 막는다.
      "no-restricted-syntax": [
        "error",
        { selector: `ImportExpression[source.value=${SUPABASE_SOURCE}]`, message: SUPABASE_MESSAGE },
        {
          selector: `CallExpression[callee.name="require"][arguments.0.value=${SUPABASE_SOURCE}]`,
          message: SUPABASE_MESSAGE,
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
