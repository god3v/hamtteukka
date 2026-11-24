import { afterEach, describe, expect, test, vi } from "vitest";
import { readPublicSupabaseEnv, supabaseUrlSchema } from "./supabase-env.ts";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("supabaseUrlSchema", () => {
  test("https 주소를 받는다", () => {
    expect(supabaseUrlSchema.safeParse("https://example.supabase.co").success).toBe(true);
  });

  test("http는 로컬 스택의 루프백 주소에만 받는다", () => {
    expect(supabaseUrlSchema.safeParse("http://127.0.0.1:54321").success).toBe(true);
    expect(supabaseUrlSchema.safeParse("http://localhost:54321").success).toBe(true);
    expect(supabaseUrlSchema.safeParse("http://[::1]:54321").success).toBe(true);
  });

  test("원격 http 주소와 다른 프로토콜은 거부한다", () => {
    expect(supabaseUrlSchema.safeParse("http://example.supabase.co").success).toBe(false);
    expect(supabaseUrlSchema.safeParse("http://192.168.0.10:54321").success).toBe(false);
    expect(supabaseUrlSchema.safeParse("ftp://example.supabase.co").success).toBe(false);
  });
});

describe("readPublicSupabaseEnv", () => {
  test("원격 http 주소이면 https를 쓰라는 오류를 낸다", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    expect(() => readPublicSupabaseEnv()).toThrow(/https/);
  });
});
