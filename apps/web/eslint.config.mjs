import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// ADR-0003: Supabase 클라이언트(@supabase/*)는 packages/shared 안에서만 쓴다. 앱은 @hamtteukka/shared 함수만 호출한다.
const SUPABASE_MESSAGE =
  "Supabase 패키지는 packages/shared 안에서만 import한다. @hamtteukka/shared의 함수를 호출한다 (ADR-0003).";
const SUPABASE_SOURCE = "/^@supabase\\//";
// 치환식 없는 템플릿 리터럴(`@supabase/...`)의 값을 검사하는 조건.
const STATIC_TEMPLATE = `[expressions.length=0][quasis.0.value.cooked=${SUPABASE_SOURCE}]`;

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // import 문과 export ... from 문, import type 문을 막는다. 하위 경로(@supabase/ssr/dist/...)도 포함한다.
      "no-restricted-imports": ["error", { patterns: [{ regex: "^@supabase/", message: SUPABASE_MESSAGE }] }],
      // no-restricted-imports가 보지 않는 동적 import()와 require()를 막는다.
      // 인수가 문자열이거나 치환식 없는 템플릿 리터럴일 때 검사한다. 경로를 조합하는 식은 검사하지 않는다.
      "no-restricted-syntax": [
        "error",
        { selector: `ImportExpression[source.value=${SUPABASE_SOURCE}]`, message: SUPABASE_MESSAGE },
        { selector: `ImportExpression > TemplateLiteral.source${STATIC_TEMPLATE}`, message: SUPABASE_MESSAGE },
        {
          selector: `CallExpression[callee.name="require"][arguments.0.value=${SUPABASE_SOURCE}]`,
          message: SUPABASE_MESSAGE,
        },
        {
          selector: `CallExpression[callee.name="require"] > TemplateLiteral.arguments:first-child${STATIC_TEMPLATE}`,
          message: SUPABASE_MESSAGE,
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
