import { describe, expect, it } from "vitest";
import { loginSchema, profileSchema, registerSchema } from "../src/validations/schemas";

describe("validation schemas", () => {
  it("rejects duplicate-unsafe / invalid registration", () => {
    expect(() => registerSchema.parse({ name: "A", email: "not-an-email", password: "123" })).toThrow();
    expect(() => registerSchema.parse({ name: "Suraj", email: "a@b.com", password: "12345" })).toThrow();
    expect(registerSchema.parse({ name: "Suraj", email: "a@b.com", password: "secret123" }).email).toBe("a@b.com");
  });

  it("requires email+password on login", () => {
    expect(() => loginSchema.parse({ email: "a@b.com" })).toThrow();
  });

  it("rejects out-of-range cgpa", () => {
    expect(() => profileSchema.parse({ cgpa: 11 })).toThrow();
    expect(profileSchema.parse({ cgpa: 8.5 }).cgpa).toBe(8.5);
  });
});
