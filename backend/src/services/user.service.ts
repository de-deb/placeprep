import { prisma } from "../config/db";
import { hashPassword, toSafeUser, verifyPassword } from "../utils/password";

/** Account + preferences for /settings. Never returns password hashes. */
export const userService = {
  async updateAccount(userId: string, name: string) {
    const user = await prisma.user.update({ where: { id: userId }, data: { name: name.trim() } });
    return toSafeUser(user);
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const e = new Error("User not found") as Error & { status: number };
      e.status = 404;
      throw e;
    }
    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) {
      const e = new Error("Current password is incorrect") as Error & { status: number };
      e.status = 400;
      throw e;
    }
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(newPassword) } });
    return { ok: true };
  },

  async getPrefs(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const e = new Error("User not found") as Error & { status: number };
      e.status = 404;
      throw e;
    }
    return {
      notifyDeadlines: true,
      notifyStatus: true,
      notifyAnnouncements: true,
      notifyPreparation: true,
      ...((user.notificationPrefs ?? {}) as Record<string, boolean>),
    };
  },

  async updatePrefs(userId: string, prefs: Record<string, boolean>) {
    const current = await this.getPrefs(userId);
    const merged = { ...current, ...prefs };
    await prisma.user.update({ where: { id: userId }, data: { notificationPrefs: merged } });
    return merged;
  },
};
