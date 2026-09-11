import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { signToken } from "../src/utils/jwt";

const app = createApp();

describe("http layer (no DB required)", () => {
  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("protected routes reject missing JWT", async () => {
    const res = await request(app).get("/api/dashboard");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("protected routes reject invalid JWT", async () => {
    const res = await request(app).get("/api/dashboard").set("Authorization", "Bearer invalid");
    expect(res.status).toBe(401);
  });

  it("unknown api routes return 404 when authenticated, 401 otherwise", async () => {
    const unauth = await request(app).get("/api/nope");
    expect(unauth.status).toBe(401);

    const token = signToken({ sub: "test-user", role: "STUDENT" });
    const auth = await request(app).get("/api/nope").set("Authorization", `Bearer ${token}`);
    expect(auth.status).toBe(404);
    expect(auth.body.success).toBe(false);
  });

  it("login rejects invalid body with 400", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "bad" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
