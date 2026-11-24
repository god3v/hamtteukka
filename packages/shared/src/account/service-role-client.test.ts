import { afterEach, describe, expect, test, vi } from "vitest";
import { createServiceRoleSupabase } from "./service-role-client.ts";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createServiceRoleSupabase", () => {
  test("API 주소와 secret 키로 클라이언트를 만든다", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_test");
    const client = createServiceRoleSupabase();
    expect(typeof client.from).toBe("function");
    expect(typeof client.auth.admin.deleteUser).toBe("function");
  });

  test("secret 키가 없으면 설정 방법을 알려 주는 오류를 낸다", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    expect(() => createServiceRoleSupabase()).toThrow(/SUPABASE_SECRET_KEY/);
  });
});
