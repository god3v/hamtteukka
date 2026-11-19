import { z } from "zod";

export const appInfoSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  release: z.enum(["R0", "R1", "R1+", "R2", "R3", "R4", "A1"]),
  /** 고객 문의 메일 주소. 아직 정하지 않았으면 null이고, 화면은 "준비 중"으로 표시한다. */
  supportEmail: z.email().nullable(),
});

export type AppInfo = z.infer<typeof appInfoSchema>;

/** 화면 머리글과 메타데이터에 쓰는 서비스 기본 정보를 반환한다. */
export function getAppInfo(): AppInfo {
  return appInfoSchema.parse({
    name: "함뜨까",
    description: "뜨개 기록 도구와 도안 공유를 잇는 서비스",
    release: "R0",
    // 운영 공개 전에 실제 문의 주소로 바꾼다.
    supportEmail: null,
  });
}
