import { describe, expect, test } from "vitest";
import { accountErrorSchema, toAccountError } from "./account-error.ts";

describe("AccountError", () => {
  test("design/domain.md의 오류 9개를 그대로 정의한다", () => {
    expect(accountErrorSchema.options).toEqual([
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
  });
});

describe("toAccountError", () => {
  test("DB 함수가 오류 코드를 메시지로 올린 오류는 그 코드로 바꾼다", () => {
    expect(toAccountError({ code: "P0001", message: "AGE_NOT_CONFIRMED" })).toBe("AGE_NOT_CONFIRMED");
    expect(toAccountError(new Error("NOT_MEMBER"))).toBe("NOT_MEMBER");
  });

  test("오류 코드가 아닌 메시지는 UNEXPECTED로 바꾼다", () => {
    expect(toAccountError({ code: "42501", message: "permission denied for table members" })).toBe("UNEXPECTED");
    expect(toAccountError(new Error("fetch failed"))).toBe("UNEXPECTED");
  });

  test("메시지가 없는 값은 UNEXPECTED로 바꾼다", () => {
    expect(toAccountError(null)).toBe("UNEXPECTED");
    expect(toAccountError(undefined)).toBe("UNEXPECTED");
    expect(toAccountError("NOT_MEMBER")).toBe("UNEXPECTED");
    expect(toAccountError({ message: 42 })).toBe("UNEXPECTED");
  });
});
