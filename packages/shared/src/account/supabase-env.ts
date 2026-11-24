// Supabase 접속 정보를 환경 변수에서 읽는다. 변수 이름은 루트의 .env.example을 따른다.
// Next.js는 `process.env.NEXT_PUBLIC_...`를 그대로 적은 곳만 브라우저 번들에 값으로 바꿔 넣으므로, 변수 이름을 조합하지 않는다.
import { z } from "zod";

const SETUP_HINT = "로컬은 .env.example을 apps/web/.env.local로 복사하고 `pnpm db:status`가 출력하는 값을 채운다.";

const publicEnvSchema = z.object({
  url: z.url(),
  publishableKey: z.string().min(1),
});

export type PublicSupabaseEnv = z.infer<typeof publicEnvSchema>;

/** 브라우저와 서버가 함께 쓰는 API 주소와 publishable 키를 읽는다. 값이 없으면 설정 방법을 담은 오류를 낸다. */
export function readPublicSupabaseEnv(): PublicSupabaseEnv {
  const parsed = publicEnvSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  if (!parsed.success) {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY를 설정해야 한다. ${SETUP_HINT}`);
  }
  return parsed.data;
}
