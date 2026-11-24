// 계정 함수가 돌려주는 자체 오류 타입. docs/specs/001-account/design/domain.md의 AccountError를 따른다.
// Supabase 오류 타입(PostgrestError, AuthError)은 이 패키지 밖으로 내보내지 않고 이 값으로 바꾼다 (ADR-0003).
import { z } from "zod";

export const accountErrorSchema = z.enum([
  "AUTH_FAILED",
  "NOT_SIGNED_IN",
  "NOT_MEMBER",
  "ALREADY_MEMBER",
  "AGE_NOT_CONFIRMED",
  "TERMS_NOT_AGREED",
  "TERMS_OUTDATED",
  "DELETION_ALREADY_REQUESTED",
  "UNEXPECTED",
]);

export type AccountError = z.infer<typeof accountErrorSchema>;

export type AccountResult<T> = { ok: true; value: T } | { ok: false; error: AccountError };

/**
 * Supabase 호출이 남긴 오류를 AccountError로 바꾼다.
 * 계정 DB 함수는 거부 이유를 `raise exception 'NOT_MEMBER'`처럼 AccountError 값 그대로 메시지에 담아 올린다.
 * 메시지가 AccountError 값이면 그 값을, 그 밖의 오류는 UNEXPECTED를 돌려준다.
 */
export function toAccountError(error: unknown): AccountError {
  if (typeof error !== "object" || error === null || !("message" in error)) return "UNEXPECTED";
  const parsed = accountErrorSchema.safeParse(error.message);
  return parsed.success ? parsed.data : "UNEXPECTED";
}
