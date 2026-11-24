// RLS를 거치지 않는 secret 키로 Supabase를 부르는 클라이언트를 만든다. 서버 작업 함수(accountServerJobs)만 쓴다.
// server-only: 클라이언트 컴포넌트가 이 파일을 import하면 Next.js 빌드가 실패한다 (헌법 P-10).
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const serviceRoleEnvSchema = z.object({
  url: z.url(),
  secretKey: z.string().min(1),
});

/** secret 키 클라이언트를 만든다. 세션을 저장하거나 갱신하지 않는다. 값이 없으면 설정 방법을 담은 오류를 낸다. */
export function createServiceRoleSupabase(): SupabaseClient {
  const parsed = serviceRoleEnvSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    secretKey: process.env.SUPABASE_SECRET_KEY,
  });
  if (!parsed.success) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SECRET_KEY를 설정해야 한다. SUPABASE_SECRET_KEY는 서버 환경 변수로만 두고 NEXT_PUBLIC_ 접두사를 붙이지 않는다.",
    );
  }
  return createClient(parsed.data.url, parsed.data.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
