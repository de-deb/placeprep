import { prisma } from "../config/db";
import { canTransition, isTerminal, isValidStatus } from "../utils/constants";
import { notificationService } from "./notification.service";

export const companyService = {
  list(search?: string) {
    return prisma.company.findMany({
      where: search
        ? { name: { contains: search, mode: "insensitive" } }
        : undefined,
      orderBy: { name: "asc" },
      include: { _count: { select: { drives: true } } },
    });
  },
  getById(id: string) {
    return prisma.company.findUnique({ where: { id }, include: { drives: { orderBy: { date: "asc" } } } });
  },
  create(data: Parameters<typeof prisma.company.create>[0]["data"]) {
    return prisma.company.create({ data });
  },
  update(id: string, data: Parameters<typeof prisma.company.update>[0]["data"]) {
    return prisma.company.update({ where: { id }, data });
  },
  remove(id: string) {
    return prisma.company.delete({ where: { id } });
  },
};

export const driveService = {
  list(status?: string) {
    return prisma.drive.findMany({
      where: status ? { status } : undefined,
      include: { company: true, _count: { select: { applications: true } } },
      orderBy: { date: "asc" },
    });
  },
  getById(id: string) {
    return prisma.drive.findUnique({
      where: { id },
      include: { company: true, _count: { select: { applications: true } } },
    });
  },
  create(data: Parameters<typeof prisma.drive.create>[0]["data"]) {
    return prisma.drive.create({ data, include: { company: true } });
  },
  update(id: string, data: Parameters<typeof prisma.drive.update>[0]["data"]) {
    return prisma.drive.update({ where: { id }, data, include: { company: true } });
  },
  remove(id: string) {
    return prisma.drive.delete({ where: { id } });
  },
};

export const applicationService = {
  listForUser(userId: string) {
    return prisma.application.findMany({
      where: { userId },
      include: { drive: { include: { company: true } } },
      orderBy: { appliedAt: "desc" },
    });
  },
  async apply(userId: string, driveId: string) {
    const drive = await prisma.drive.findUnique({ where: { id: driveId } });
    if (!drive) {
      const e = new Error("Drive not found") as Error & { status: number };
      e.status = 404;
      throw e;
    }
    if (drive.status === "CLOSED") {
      const e = new Error("This drive is closed") as Error & { status: number };
      e.status = 400;
      throw e;
    }
    const existing = await prisma.application.findUnique({
      where: { userId_driveId: { userId, driveId } },
    });
    if (existing) {
      const e = new Error("Already applied to this drive") as Error & { status: number };
      e.status = 409;
      throw e;
    }
    const app = await prisma.application.create({
      data: { userId, driveId },
      include: { drive: { include: { company: true } } },
    });
    await prisma.applicationStatusHistory.create({
      data: { applicationId: app.id, oldStatus: "—", newStatus: "APPLIED", changedById: userId },
    });
    return app;
  },
  /** Student withdraw = status change (keeps history instead of deleting). */
  async withdraw(userId: string, id: string) {
    const app = await prisma.application.findFirst({ where: { id, userId } });
    if (!app) {
      const e = new Error("Application not found") as Error & { status: number };
      e.status = 404;
      throw e;
    }
    if (isTerminal(app.status)) {
      const e = new Error(`Cannot withdraw — application is ${app.status}`) as Error & { status: number };
      e.status = 400;
      throw e;
    }
    return this.setStatus(app.id, "WITHDRAWN", userId, "Withdrawn by student");
  },
  /** Timeline view: application + ordered status history. */
  async timeline(userId: string, id: string) {
    const app = await prisma.application.findFirst({
      where: { id, userId },
      include: {
        drive: { include: { company: true } },
        history: { orderBy: { createdAt: "asc" }, include: { changedBy: { select: { name: true, role: true } } } },
      },
    });
    if (!app) {
      const e = new Error("Application not found") as Error & { status: number };
      e.status = 404;
      throw e;
    }
    return app;
  },
  /**
   * Status change with transition validation + history + student notification.
   * `actorId` is the admin (or student for withdraw); `actorRole` gates rules.
   */
  async setStatus(id: string, to: string, actorId: string, note?: string | null, actorRole = "ADMIN") {
    if (!isValidStatus(to)) {
      const e = new Error("Invalid status") as Error & { status: number };
      e.status = 400;
      throw e;
    }
    const app = await prisma.application.findUnique({
      where: { id },
      include: { drive: { select: { title: true } } },
    });
    if (!app) {
      const e = new Error("Application not found") as Error & { status: number };
      e.status = 404;
      throw e;
    }
    if (actorRole !== "ADMIN" && to !== "WITHDRAWN") {
      const e = new Error("Only the placement cell can change application status") as Error & { status: number };
      e.status = 403;
      throw e;
    }
    if (!canTransition(app.status, to)) {
      const e = new Error(`Cannot move from ${app.status} to ${to}`) as Error & { status: number };
      e.status = 400;
      throw e;
    }
    const [updated] = await prisma.$transaction([
      prisma.application.update({ where: { id }, data: { status: to } }),
      prisma.applicationStatusHistory.create({
        data: { applicationId: id, oldStatus: app.status, newStatus: to, changedById: actorId, note: note ?? undefined },
      }),
    ]);
    await notificationService.notify({
      userId: app.userId,
      type: "APPLICATION_STATUS",
      title: `Application update: ${app.drive.title}`,
      message: `Your application moved from ${app.status} to ${to}.`,
      link: "/applications",
      ref: `appstatus:${id}:${to}`,
    });
    return updated;
  },
  /** Admin applicant table for one drive, with profile filters. */
  async applicantsForDrive(
    driveId: string,
    filters: { search?: string; branch?: string; minCgpa?: number; status?: string; eligibleOnly?: boolean }
  ) {
    const apps = await prisma.application.findMany({
      where: {
        driveId,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.search
          ? {
              user: {
                OR: [
                  { name: { contains: filters.search, mode: "insensitive" } },
                  { email: { contains: filters.search, mode: "insensitive" } },
                ],
              },
            }
          : {}),
      },
      include: { user: { include: { profile: true } } },
      orderBy: { appliedAt: "desc" },
    });
    return apps
      .map(({ user, ...a }) => {
        const { passwordHash: _omit, ...safe } = user;
        return { ...a, student: safe };
      })
      .filter((a) => {
        const p = a.student.profile;
        if (filters.branch && p?.branch?.toLowerCase() !== filters.branch.toLowerCase()) return false;
        if (filters.minCgpa != null && (p?.cgpa ?? -1) < filters.minCgpa) return false;
        return true;
      });
  },
  /** Bulk status change (same transition applied to many applications). */
  async bulkSetStatus(ids: string[], to: string, actorId: string, note?: string | null) {
    if (!isValidStatus(to)) {
      const e = new Error("Invalid status") as Error & { status: number };
      e.status = 400;
      throw e;
    }
    const results = { updated: 0, skipped: 0 };
    for (const id of ids.slice(0, 100)) {
      try {
        await this.setStatus(id, to, actorId, note);
        results.updated += 1;
      } catch {
        results.skipped += 1;
      }
    }
    return results;
  },
};

export const resourceService = {
  list(category?: string, opts?: { search?: string; level?: string; tag?: string; featured?: boolean; company?: string }) {
    return prisma.resource.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(opts?.level ? { level: opts.level } : {}),
        ...(opts?.tag ? { tags: { has: opts.tag } } : {}),
        ...(opts?.featured ? { featured: true } : {}),
        ...(opts?.company ? { company: opts.company } : {}),
        ...(opts?.search
          ? { OR: [{ title: { contains: opts.search, mode: "insensitive" } }, { description: { contains: opts.search, mode: "insensitive" } }] }
          : {}),
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });
  },
  async listWithBookmarks(userId: string, category?: string, opts?: { search?: string; level?: string; tag?: string; featured?: boolean; bookmarked?: boolean; company?: string }) {
    const resources = await this.list(category, opts);
    const bookmarks = await prisma.resourceBookmark.findMany({ where: { userId } });
    const marked = new Set(bookmarks.map((b) => b.resourceId));
    const withFlags = resources.map((r) => ({ ...r, bookmarked: marked.has(r.id) }));
    return opts?.bookmarked ? withFlags.filter((r) => r.bookmarked) : withFlags;
  },
  toggleBookmark(userId: string, resourceId: string) {
    return prisma.resourceBookmark.findUnique({ where: { userId_resourceId: { userId, resourceId } } }).then(
      async (existing) => {
        if (existing) {
          await prisma.resourceBookmark.delete({ where: { id: existing.id } });
          return { resourceId, bookmarked: false };
        }
        await prisma.resourceBookmark.create({ data: { userId, resourceId } });
        return { resourceId, bookmarked: true };
      }
    );
  },
  create(data: Parameters<typeof prisma.resource.create>[0]["data"]) {
    return prisma.resource.create({ data });
  },
  update(id: string, data: Parameters<typeof prisma.resource.update>[0]["data"]) {
    return prisma.resource.update({ where: { id }, data });
  },
  remove(id: string) {
    return prisma.resource.delete({ where: { id } });
  },
};

export const announcementService = {
  list() {
    return prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });
  },
  create(data: Parameters<typeof prisma.announcement.create>[0]["data"]) {
    return prisma.announcement.create({ data });
  },
  update(id: string, data: Parameters<typeof prisma.announcement.update>[0]["data"]) {
    return prisma.announcement.update({ where: { id }, data });
  },
  remove(id: string) {
    return prisma.announcement.delete({ where: { id } });
  },
};
