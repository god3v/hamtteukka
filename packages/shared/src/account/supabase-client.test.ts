import { afterEach, describe, expect, test, vi } from "vitest";
import { createBrowserSupabase, createServerSupabase, toCookieMethods, type CookieAdapter, type CookieToSet } from "./supabase-client.ts";

const LOCAL_URL = "http://127.0.0.1:54321";

function stubPublicEnv() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", LOCAL_URL);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
}

function fakeAdapter(cookies: { name: string; value: string }[] = []) {
  const written: { cookies: CookieToSet[]; headers: Record<string, string> }[] = [];
  const adapter: CookieAdapter = {
    getAll: () => cookies,
    setAll: (toSet, headers) => {
      written.push({ cookies: toSet, headers });
    },
  };
  return { adapter, written };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("toCookieMethods", () => {
  test("요청의 쿠키를 그대로 읽는다", () => {
    const { adapter } = fakeAdapter([{ name: "sb-access", value: "token" }]);
    expect(toCookieMethods(adapter).getAll()).toEqual([{ name: "sb-access", value: "token" }]);
  });

  test("쿠키를 쓸 때 알려진 옵션만 넘기고 캐시 헤더를 함께 넘긴다", async () => {
    const { adapter, written } = fakeAdapter();
    const expires = new Date("2026-12-01T00:00:00Z");
    const options = {
      path: "/",
      maxAge: 3600,
      expires,
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      encode: (value: string) => value,
    };
    await toCookieMethods(adapter).setAll([{ name: "sb-access", value: "token", options }], { "Cache-Control": "private, no-store" });
    expect(written).toEqual([
      {
        cookies: [{ name: "sb-access", value: "token", options: { path: "/", maxAge: 3600, expires, httpOnly: true, secure: true, sameSite: "lax" } }],
        headers: { "Cache-Control": "private, no-store" },
      },
    ]);
  });
});

describe("createServerSupabase", () => {
  test("공개 환경 변수와 쿠키 어댑터로 클라이언트를 만든다", () => {
    stubPublicEnv();
    const client = createServerSupabase(fakeAdapter().adapter);
    expect(typeof client.from).toBe("function");
    expect(typeof client.auth.getClaims).toBe("function");
  });

  test("공개 환경 변수가 없으면 설정 방법을 알려 주는 오류를 낸다", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(() => createServerSupabase(fakeAdapter().adapter)).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});

describe("createBrowserSupabase", () => {
  test("공개 환경 변수가 없으면 설정 방법을 알려 주는 오류를 낸다", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", LOCAL_URL);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(() => createBrowserSupabase()).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  });
});
