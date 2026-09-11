import { prisma } from "../config/db";

export interface NotifyInput {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  ref?: string;
}

const DEFAULT_PREFS = {
  notifyDeadlines: true,
  notifyStatus: true,
  notifyAnnouncements: true,
  notifyPreparation: true,
};

function prefsFor(user: { notificationPrefs: unknown }) {
  const raw = (user.notificationPrefs ?? {}) as Record<string, unknown>;
  return { ...DEFAULT_PREFS, ...raw };
}

function prefKeyFor(type: string): keyof typeof DEFAULT_PREFS | null {
  if (type === "DRIVE_DEADLINE") return "notifyDeadlines";
  if (type === "APPLICATION_STATUS") return "notifyStatus";
  if (type === "ANNOUNCEMENT") return "notifyAnnouncements";
  if (type === "PREPARATION") return "notifyPreparation";
  return null;
}

/** In-app notifications. Preferences live on the user; SYSTEM always sends. */
export const notificationService = {
  list(userId: string, unreadOnly = false, take = 50) {
    return prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { read: false } : {}) },
      orderBy: { createdAt: "desc" },
      take,
    });
  },

  unreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, read: false } });
  },

  async markRead(userId: string, id: string) {
    const n = await prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });
    if (n.count === 0) {
      const e = new Error("Notification not found") as Error & { status: number };
      e.status = 404;
      throw e;
    }
    return { id };
  },

  markAllRead(userId: string) {
    return prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  },

  /** Single notify that respects the recipient's preferences. */
  async notify(input: NotifyInput) {
    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!user || user.role !== "STUDENT") return null;
    const prefs = prefsFor(user);
    const key = prefKeyFor(input.type);
    if (key && !prefs[key]) return null;
    // Dedupe reminders: one unread notification per ref.
    if (input.ref) {
      const existing = await prisma.notification.findFirst({
        where: { userId: input.userId, ref: input.ref, read: false },
      });
      if (existing) return existing;
    }
    return prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link ?? undefined,
        ref: input.ref ?? undefined,
      },
    });
  },

  /** Fan-out to every student (used for announcements). Respects prefs each. */
  async notifyAllStudents(input: Omit<NotifyInput, "userId">) {
    const students = await prisma.user.findMany({ where: { role: "STUDENT" }, select: { id: true } });
    let sent = 0;
    for (const s of students) {
      const r = await this.notify({ ...input, userId: s.id });
      if (r) sent += 1;
    }
    return { sent, total: students.length };
  },
};
