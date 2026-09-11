import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../src/utils/password";
import { signToken, verifyToken } from "../src/utils/jwt";

describe("password hashing", () => {
  it("hashes and verifies correctly, rejects wrong password", async () => {
    const hash = await hashPassword("Student@123");
    expect(hash).not.toContain("Student@123");
    expect(await verifyPassword("Student@123", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});

describe("jwt", () => {
  it("signs and verifies a payload", () => {
    const token = signToken({ sub: "user-1", role: "STUDENT" });
    expect(typeof token).toBe("string");
    const payload = verifyToken(token);
    expect(payload.sub).toBe("user-1");
    expect(payload.role).toBe("STUDENT");
  });

  it("rejects tampered tokens", () => {
    const token = signToken({ sub: "user-1", role: "STUDENT" });
    expect(() => verifyToken(token + "tamper")).toThrow();
  });
});
