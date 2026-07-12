import { Request, Response } from "express";
import { prisma } from "@repo/database";
import env from "../../config/env.config.js";

export const getHealth = async (_req: Request, res: Response) => {
  const start = Date.now();

  // ── DB ────────────────────────────────────────────────────────────────────────
  let dbStatus: "connected" | "error" = "error";
  let dbLatencyMs = 0;
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = "connected";
  } catch {}

  // ── Memory ────────────────────────────────────────────────────────────────────
  const mem = process.memoryUsage();
  const toMB = (bytes: number) => Math.round(bytes / 1024 / 1024);

  // ── Services ──────────────────────────────────────────────────────────────────
  const services = {
    resend: env.RESEND_API_KEY ? "configured" : "not_configured",
    r2:     env.R2_ACCOUNT_ID  ? "configured" : "not_configured",
  };

  const overallStatus = dbStatus === "connected" ? "healthy" : "degraded";

  res.status(dbStatus === "connected" ? 200 : 503).json({
    status:    overallStatus,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    responseTimeMs: Date.now() - start,
    database: {
      status:    dbStatus,
      latencyMs: dbLatencyMs,
    },
    memory: {
      heapUsedMB:  toMB(mem.heapUsed),
      heapTotalMB: toMB(mem.heapTotal),
      rssMB:       toMB(mem.rss),
    },
    services,
    version: process.env.npm_package_version ?? "unknown",
    environment: env.NODE_ENV,
  });
};

// ── TEMPORARY: DB diagnostic (reveals host only, password masked) ─────────────
export const getDbInfo = async (_req: Request, res: Response) => {
  const raw = process.env.DATABASE_URL ?? "NOT_SET";

  // Parse the URL to extract host/db info without leaking the password
  let host = "unknown";
  let database = "unknown";
  let user = "unknown";
  try {
    const url = new URL(raw);
    host = url.hostname + ":" + url.port;
    database = url.pathname.replace("/", "");
    user = url.username;
  } catch {}

  // Count users to confirm which database this is
  let userCount = -1;
  let tenantCount = -1;
  try {
    const [uc, tc] = await Promise.all([
      prisma.user.count(),
      prisma.tenant.count(),
    ]);
    userCount = uc;
    tenantCount = tc;
  } catch {}

  res.json({
    host,
    database,
    user,
    userCount,
    tenantCount,
    rawPrefix: raw.substring(0, 30) + "...[masked]",
  });
};
