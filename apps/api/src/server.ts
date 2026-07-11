process.on("unhandledRejection", (reason: unknown) => {
  console.error("🔴 [UnhandledRejection]", reason);
});
process.on("uncaughtException", (err: Error) => {
  console.error("🔴 [UncaughtException]", err.message, err.stack);
  process.exit(1);
});

import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { runMigrationsAndSeed } from "./db/migrate.js";
import { globalErrorHandler }  from "./middleware/error.middleware.js";
import { authRateLimiter }     from "./middleware/security.middleware.js";
import { auditLog }            from "./middleware/audit.middleware.js";
import { maintenanceMode }     from "./middleware/maintenance.middleware.js";
import systemRoutes       from "./modules/system/system.routes.js";
import authRoutes         from "./modules/auth/auth.routes.js";
import userRoutes         from "./modules/users/user.routes.js";
import adminRoutes        from "./modules/admin/admin.routes.js";
import superAdminRoutes   from "./modules/super-admin/super-admin.routes.js";
import notificationRoutes from "./modules/notifications/notification.routes.js";
import tenantRoutes       from "./modules/tenants/tenant.routes.js";
import siteRoutes         from "./modules/sites/site.routes.js";
import visitorRoutes      from "./modules/visitors/visitor.routes.js";
import incidentRoutes     from "./modules/incidents/incident.routes.js";
import shiftRoutes        from "./modules/shifts/shift.routes.js";
import shiftTemplateRoutes from "./modules/shift-templates/shift-template.routes.js";
import postRoutes         from "./modules/sites/post.routes.js";
import occurrenceRoutes   from "./modules/occurrence/occurrence.routes.js";
import ticketRoutes       from "./modules/tickets/ticket.routes.js";
import planRoutes         from "./modules/plans/plan.routes.js";

import managerRoutes      from "./modules/manager/manager.routes.js";
import siteManagerRoutes  from "./modules/site-manager/site-manager.routes.js";

const app: Express = express();
const isProduction = process.env.NODE_ENV === "production";

// ── 1. SECURITY & LOGGING ─────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan(isProduction ? "combined" : "dev"));

// ── 2. CORS ───────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:8081",
  "http://localhost:8082",
  process.env.FRONTEND_URL ?? "",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.some((allowed) =>
        origin.startsWith(allowed)
      ) || 
      origin.endsWith('.vercel.app') || 
      origin.endsWith('.vercel.live') ||
      origin === 'https://webmobilefirst.com' ||
      origin.endsWith('.webmobilefirst.com');

      const isDevOrigin = !isProduction && (
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('http://10.0.2.2:') ||
        origin.startsWith('http://192.168.') ||
        origin.startsWith('http://172.') ||
        origin.startsWith('http://10.')
      );
      
      if (isAllowed || isDevOrigin) {
        callback(null, true);
      } else {
        console.error(`🔴 CORS Blocked: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials:    true,
    methods:        ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── 3. PARSERS ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── 4. CROSS-CUTTING MIDDLEWARE ───────────────────────────────────────────────
app.use(maintenanceMode);
app.use(auditLog);

// ── 5. ROUTES ─────────────────────────────────────────────────────────────────
const API = "/api/v1";

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Gladiator Pro Security System API is online",
    timestamp: new Date().toISOString(),
  });
});

app.use(`${API}/system`,        systemRoutes);
app.use(`${API}/auth`,          authRateLimiter, authRoutes);
app.use(`${API}/users`,         userRoutes);
app.use(`${API}/admin`,         adminRoutes);
app.use(`${API}/super-admin`,   superAdminRoutes);
app.use(`${API}/manager`,       managerRoutes);
app.use(`${API}/site-manager`,  siteManagerRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/tenants`,       tenantRoutes);
app.use(`${API}/sites`,         siteRoutes);
app.use(`${API}/posts`,         postRoutes);
app.use(`${API}/occurrences`,   occurrenceRoutes);
app.use(`${API}/ob-entries`,    occurrenceRoutes);
app.use(`${API}/visitors`,      visitorRoutes);
app.use(`${API}/incidents`,     incidentRoutes);
app.use(`${API}/shifts`,        shiftRoutes);
app.use(`${API}/shift-templates`, shiftTemplateRoutes);
app.use(`${API}/tickets`,       ticketRoutes);
app.use(`${API}/plans`,         planRoutes);

// ── 6. 404 ────────────────────────────────────────────────────────────────────
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status:  "fail",
    message: `Route ${req.originalUrl} not found`,
  });
});

// ── 7. ERROR HANDLER ──────────────────────────────────────────────────────────
app.use(globalErrorHandler);

// ── 8. START ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

(async () => {
  await runMigrationsAndSeed();

  app.listen(PORT, () => {
    console.log(`\n─────────────────────────────────────────`);
    console.log(`🚀  API RUNNING`);
    console.log(`🌍  MODE:   ${process.env.NODE_ENV || "development"}`);
    console.log(`🔗  URL:    http://localhost:${PORT}${API}`);
    console.log(`─────────────────────────────────────────\n`);
  });
})();

export default app;
