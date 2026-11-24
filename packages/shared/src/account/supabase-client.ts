// 요청의 세션으로 Supabase를 부르는 클라이언트를 만든다. 권한은 RLS가 검사한다 (ADR-0004).
// 이 파일의 함수는 packages/shared의 계정 함수 안에서만 쓰고 src/index.ts로 내보내지 않는다 (ADR-0003).
// 앱은 Supabase 타입 대신 아래의 CookieAdapter로 요청과 응답의 쿠키를 넘긴다.
import { createBrowserClient, createServerClient, type CookieMethodsServer, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readPublicSupabaseEnv } from "./supabase-env.ts";

/** 세션 쿠키에 쓰는 옵션. Next.js의 `cookies().set()`이 받는 옵션과 같은 이름을 쓴다. */
export type CookieOptionsDto = {
  domain?: string;
  path?: string;
  maxAge?: number;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: boolean | "lax" | "strict" | "none";
  priority?: "low" | "medium" | "high";
  partitioned?: boolean;
};

export type CookieToSet = { name: string; value: string; options: CookieOptionsDto };

/**
 * 요청의 쿠키를 읽고 응답에 쿠키를 쓰는 어댑터. 서버에서 부르는 계정 함수가 인수로 받는다.
 * setAll의 headers는 세션 쿠키를 쓴 응답이 CDN에 캐시되지 않도록 응답에 함께 붙여야 하는 헤더다.
 */
export type CookieAdapter = {
  getAll(): { name: string; value: string }[];
  setAll(cookies: CookieToSet[], headers: Record<string, string>): void;
};

function toCookieOptionsDto(options: CookieOptions): CookieOptionsDto {
  const { domain, path, maxAge, expires, httpOnly, secure, sameSite, priority, partitioned } = options;
  const picked: CookieOptionsDto = { domain, path, maxAge, expires, httpOnly, secure, sameSite, priority, partitioned };
  return Object.fromEntries(Object.entries(picked).filter(([, value]) => value !== undefined)) as CookieOptionsDto;
}

type CookieMethods = Pick<CookieMethodsServer, "getAll"> & Required<Pick<CookieMethodsServer, "setAll">>;

/** CookieAdapter를 @supabase/ssr이 받는 쿠키 함수로 바꾼다. 쿠키 값의 인코딩 함수처럼 앱이 알 필요 없는 옵션은 넘기지 않는다. */
export function toCookieMethods(adapter: CookieAdapter): CookieMethods {
  return {
    getAll: () => adapter.getAll(),
    setAll: (cookies, headers) => {
      adapter.setAll(
        cookies.map(({ name, value, options }) => ({ name, value, options: toCookieOptionsDto(options) })),
        headers ?? {},
      );
    },
  };
}

/** 서버 요청의 세션 쿠키로 Supabase를 부르는 클라이언트를 만든다. 요청마다 새로 만든다. */
export function createServerSupabase(cookies: CookieAdapter): SupabaseClient {
  const env = readPublicSupabaseEnv();
  return createServerClient(env.url, env.publishableKey, { cookies: toCookieMethods(cookies) });
}

/** 브라우저에서 세션 쿠키로 Supabase를 부르는 클라이언트를 만든다. */
export function createBrowserSupabase(): SupabaseClient {
  const env = readPublicSupabaseEnv();
  return createBrowserClient(env.url, env.publishableKey);
}
