import { describe, expect, it } from "vitest";

import { appInfoSchema, getAppInfo } from "./app-info";

describe("getAppInfo", () => {
  it("스키마를 통과하는 서비스 기본 정보를 반환한다", () => {
    const info = getAppInfo();

    expect(appInfoSchema.safeParse(info).success).toBe(true);
    expect(info.name).toBe("함뜨까");
    expect(info.release).toBe("R0");
  });

  it("정의하지 않은 출시 단계는 스키마가 거부한다", () => {
    const result = appInfoSchema.safeParse({
      name: "함뜨까",
      description: "설명",
      release: "R9",
      supportEmail: null,
    });

    expect(result.success).toBe(false);
  });

  it("문의 메일은 메일 주소 형식이거나 아직 정하지 않은 null만 허용한다", () => {
    const base = { name: "함뜨까", description: "설명", release: "R0" } as const;

    expect(appInfoSchema.safeParse({ ...base, supportEmail: "help@hamtteukka.kr" }).success).toBe(true);
    expect(appInfoSchema.safeParse({ ...base, supportEmail: null }).success).toBe(true);
    expect(appInfoSchema.safeParse({ ...base, supportEmail: "메일 아님" }).success).toBe(false);
  });
});
