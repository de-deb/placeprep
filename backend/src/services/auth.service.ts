import { prisma } from "../config/db";
import { hashPassword, toSafeUser, verifyPassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import type { RegisterInput } from "../validations/schemas";

function httpError(status: number, message: string): Error & { status: number } {
  return Object.assign(new Error(message), { status });
}

/** Auth business logic — controllers stay thin, Prisma stays here. */
export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (existing) throw httpError(409, "Email already registered");

    // First user can bootstrap as ADMIN only if explicitly requested AND no admin exists.
    // Otherwise force STUDENT to prevent privilege escalation via public endpoint.
    let role: "STUDENT" | "ADMIN" = "STUDENT";
    if (input.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount === 0) role = "ADMIN";
    }

    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email: input.email.toLowerCase().trim(),
        passwordHash: await hashPassword(input.password),
        role,
        profile: { create: {} },
      },
    });
    const token = signToken({ sub: user.id, role: user.role });
    return { user: toSafeUser(user), token };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) throw httpError(401, "Invalid email or password");
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw httpError(401, "Invalid email or password");
    const token = signToken({ sub: user.id, role: user.role });
    return { user: toSafeUser(user), token };
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) throw httpError(404, "User not found");
    return toSafeUser(user);
  },
};
