// Supabase 접속 정보를 환경 변수에서 읽는다. 변수 이름은 루트의 .env.example을 따른다.
// Next.js는 `process.env.NEXT_PUBLIC_...`를 그대로 적은 곳만 브라우저 번들에 값으로 바꿔 넣으므로, 변수 이름을 조합하지 않는다.
import { z } from "zod";

const SETUP_HINT = "로컬은 .env.example을 apps/web/.env.local로 복사하고 `pnpm db:status`가 출력하는 값을 채운다.";
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

/**
 * Supabase API 주소. 키와 세션 토큰이 평문으로 전송되지 않도록 https만 받고,
 * http는 로컬 스택의 루프백 주소(127.0.0.1, localhost, [::1])에만 받는다.
 */
export const supabaseUrlSchema = z.url().refine((value) => {
  // zod는 z.url() 검사가 실패해도 이 검사를 실행하므로, 주소로 읽을 수 없는 값은 여기서 거부한다.
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return url.protocol === "https:" || (url.protocol === "http:" && LOOPBACK_HOSTS.has(url.hostname));
});

export const SUPABASE_URL_RULE = "NEXT_PUBLIC_SUPABASE_URL은 https 주소여야 하고, http는 로컬 스택(127.0.0.1, localhost)에만 쓸 수 있다.";

const publicEnvSchema = z.object({
  url: supabaseUrlSchema,
  publishableKey: z.string().min(1),
});

export type PublicSupabaseEnv = z.infer<typeof publicEnvSchema>;

/** 브라우저와 서버가 함께 쓰는 API 주소와 publishable 키를 읽는다. 값이 없거나 주소가 규칙에 맞지 않으면 설정 방법을 담은 오류를 낸다. */
export function readPublicSupabaseEnv(): PublicSupabaseEnv {
  const parsed = publicEnvSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  if (!parsed.success) {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY를 확인한다. ${SUPABASE_URL_RULE} ${SETUP_HINT}`);
  }
  return parsed.data;
}
