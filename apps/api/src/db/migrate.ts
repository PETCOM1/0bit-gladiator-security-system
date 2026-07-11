/**
 * Self-contained database migration + seed runner.
 *
 * Runs automatically on every API startup (called from server.ts).
 * Uses raw pg — NOT Prisma — so it works with the transaction-mode pooler
 * (pgbouncer=true) without needing a direct database connection.
 *
 * Every statement is idempotent:
 *   CREATE TABLE IF NOT EXISTS
 *   ALTER TABLE ... ADD COLUMN IF NOT EXISTS
 *   CREATE INDEX IF NOT EXISTS
 *   INSERT ... ON CONFLICT DO NOTHING
 *
 * This means it is safe to run on every restart — existing data is never touched.
 */

import pg from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

export async function runMigrationsAndSeed(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("⚠️  [MIGRATE] DATABASE_URL not set — skipping migrations");
    return;
  }

  const pool   = new pg.Pool({ connectionString, max: 1, idleTimeoutMillis: 10_000 });
  const client = await pool.connect();

  try {
    console.log("🔄 [MIGRATE] Running startup migrations...");

    // ── Enums ────────────────────────────────────────────────────────────────
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'ACCOUNT_MANAGER', 'MANAGER', 'SITE_MANAGER', 'GUARD');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // Add SITE_MANAGER to existing ENUM if it was created previously
    await client.query(`
      DO $$ BEGIN
        ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SITE_MANAGER';
      EXCEPTION WHEN undefined_object THEN null; WHEN duplicate_object THEN null; END $$;
    `);

    // Add GUARD to existing ENUM — security guards previously shared the
    // generic USER role with no dedicated value of their own.
    await client.query(`
      DO $$ BEGIN
        ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'GUARD';
      EXCEPTION WHEN undefined_object THEN null; WHEN duplicate_object THEN null; END $$;
    `);

    // Add ACCOUNT_MANAGER to existing ENUM — platform staff who onboard and
    // support new tenants, distinct from a tenant's own MANAGER. Briefly
    // renamed to STAFF_MEMBER during development; rename back if that value
    // exists on this database. Postgres raises invalid_parameter_value
    // (22023) — not undefined_object — when the source label is already
    // gone, which is the common case after the first successful rename;
    // treat that as a safe no-op too.
    await client.query(`
      DO $$ BEGIN
        ALTER TYPE "Role" RENAME VALUE 'STAFF_MEMBER' TO 'ACCOUNT_MANAGER';
      EXCEPTION WHEN undefined_object THEN null; WHEN invalid_parameter_value THEN null; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ACCOUNT_MANAGER';
      EXCEPTION WHEN undefined_object THEN null; WHEN duplicate_object THEN null; END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "RegistrationMode" AS ENUM ('INVITE_ONLY', 'SELF_REGISTER', 'SELF_REGISTER_AUTO');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'PENDING', 'FAILED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // ── Tables ───────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id"                   TEXT          NOT NULL,
        "email"                TEXT          NOT NULL,
        "password"             TEXT          NOT NULL,
        "role"                 "Role"        NOT NULL DEFAULT 'GUARD',
        "accountStatus"        "AccountStatus" NOT NULL DEFAULT 'PENDING',
        "firstName"            TEXT,
        "lastName"             TEXT,
        "displayName"          TEXT,
        "avatarUrl"            TEXT,
        "phone"                TEXT,
        "verificationCode"     TEXT,
        "verificationExpires"  TIMESTAMP(3),
        "passwordResetToken"   TEXT,
        "passwordResetExpires" TIMESTAMP(3),
        "lastActiveAt"         TIMESTAMP(3),
        "city"                 TEXT,
        "country"              TEXT,
        "language"             TEXT,
        "dateOfBirth"          TIMESTAMP(3),
        "googleId"             TEXT,
        "googleRefreshToken"   TEXT,
        "invitedById"          TEXT,
        "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id"        TEXT NOT NULL,
        "userId"    TEXT NOT NULL,
        "action"    TEXT NOT NULL,
        "meta"      JSONB,
        "ip"        TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "Notification" (
        "id"        TEXT    NOT NULL,
        "userId"    TEXT    NOT NULL,
        "title"     TEXT    NOT NULL,
        "body"      TEXT    NOT NULL,
        "read"      BOOLEAN NOT NULL DEFAULT false,
        "link"      TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "SystemSetting" (
        "id"        TEXT NOT NULL,
        "key"       TEXT NOT NULL,
        "value"     TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "Payment" (
        "id"            TEXT NOT NULL,
        "tenantId"      TEXT NOT NULL,
        "amount"        DOUBLE PRECISION NOT NULL,
        "currency"      TEXT NOT NULL DEFAULT 'USD',
        "status"        "PaymentStatus" NOT NULL DEFAULT 'PAID',
        "invoiceNumber" TEXT,
        "billingPeriod" TEXT,
        "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "SubscriptionTier" (
        "id"        TEXT NOT NULL,
        "name"      TEXT NOT NULL UNIQUE,
        "price"     DOUBLE PRECISION NOT NULL,
        "maxUsers"  INTEGER NOT NULL DEFAULT 50,
        "maxSites"  INTEGER NOT NULL DEFAULT 1,
        "features"  JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SubscriptionTier_pkey" PRIMARY KEY ("id")
      );
    `);

    // ── Enums (PostgreSQL needs these created first) ──────────────────────────
    // Note: To make this idempotent, we check if the type exists.
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED', 'CLOSED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "SupportTicket" (
        "id"          TEXT NOT NULL,
        "tenantId"    TEXT NOT NULL,
        "createdById" TEXT NOT NULL,
        "subject"     TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "status"      "TicketStatus" NOT NULL DEFAULT 'OPEN',
        "priority"    "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
        "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "TicketMessage" (
        "id"        TEXT NOT NULL,
        "ticketId"  TEXT NOT NULL,
        "senderId"  TEXT NOT NULL,
        "content"   TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "ShiftTemplate" (
        "id"        TEXT NOT NULL,
        "tenantId"  TEXT NOT NULL,
        "name"      TEXT NOT NULL,
        "startTime" TEXT NOT NULL,
        "endTime"   TEXT NOT NULL,
        "color"     TEXT NOT NULL DEFAULT '#3b82f6',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ShiftTemplate_pkey" PRIMARY KEY ("id")
      );
    `);

    // ── Idempotent column additions (for databases created before these fields) ─
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "city"        TEXT;`);
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "country"     TEXT;`);
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "language"    TEXT;`);
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3);`);
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone"       TEXT;`);
    await client.query(`ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "subscriptionTierId" TEXT;`);
    await client.query(`ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "createdById" TEXT;`);

    // ── Indexes ──────────────────────────────────────────────────────────────
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key"    ON "User"("email");`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "User_email_idx"    ON "User"("email");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "User_role_idx"     ON "User"("role");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "User_googleId_idx" ON "User"("googleId");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "AuditLog_userId_idx"   ON "AuditLog"("userId");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "Notification_userId_read_idx" ON "Notification"("userId", "read");`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "SystemSetting_key_key" ON "SystemSetting"("key");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "Payment_tenantId_idx" ON "Payment"("tenantId");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "SupportTicket_tenantId_idx" ON "SupportTicket"("tenantId");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "SupportTicket_status_idx" ON "SupportTicket"("status");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "TicketMessage_ticketId_idx" ON "TicketMessage"("ticketId");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "Tenant_subscriptionTierId_idx" ON "Tenant"("subscriptionTierId");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "Tenant_createdById_idx" ON "Tenant"("createdById");`);
    await client.query(`CREATE INDEX        IF NOT EXISTS "ShiftTemplate_tenantId_idx" ON "ShiftTemplate"("tenantId");`);

    // ── Foreign keys (safe to re-run — DO block catches duplicate) ───────────
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "User" ADD CONSTRAINT "User_invitedById_fkey"
          FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_fkey"
          FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_tenantId_fkey"
          FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_createdById_fkey"
          FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey"
          FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "ShiftTemplate" ADD CONSTRAINT "ShiftTemplate_tenantId_fkey"
          FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_senderId_fkey"
          FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_subscriptionTierId_fkey"
          FOREIGN KEY ("subscriptionTierId") REFERENCES "SubscriptionTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_createdById_fkey"
          FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    console.log("✅ [MIGRATE] Schema ready");

    // ── Data migration: security guards used to share the generic USER role ──
    // Cast to text for the comparison so Postgres never has to validate
    // 'USER' as a Role enum literal — on a database where that label was
    // never added (fresh installs never get it, see CREATE TYPE above),
    // comparing it directly as an enum value is rejected outright before
    // the query even runs, regardless of how many rows would've matched.
    await client.query(`UPDATE "User" SET "role" = 'GUARD' WHERE "role"::text = 'USER';`);

    // ── Seed system settings ─────────────────────────────────────────────────
    await client.query(`
      INSERT INTO "SystemSetting" ("id", "key", "value", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, 'registration_mode', 'INVITE_ONLY', NOW(), NOW())
      ON CONFLICT ("key") DO NOTHING;
    `);
    await client.query(`
      INSERT INTO "SystemSetting" ("id", "key", "value", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, 'app_name', 'Gladiator Pro', NOW(), NOW())
      ON CONFLICT ("key") DO NOTHING;
    `);

    // ── Seed Subscription Tiers ───────────────────────────────────────────────
    await client.query(`
      INSERT INTO "SubscriptionTier" ("id", "name", "price", "maxUsers", "maxSites", "createdAt", "updatedAt")
      VALUES 
        ('tier-basic', 'BASIC', 99, 50, 1, NOW(), NOW()),
        ('tier-pro', 'PRO', 299, 500, 5, NOW(), NOW()),
        ('tier-enterprise', 'ENTERPRISE', 999, 9999, 999, NOW(), NOW())
      ON CONFLICT ("name") DO NOTHING;
    `);

    // Migrate old tenants to 'BASIC'
    await client.query(`
      UPDATE "Tenant" 
      SET "subscriptionTierId" = 'tier-basic'
      WHERE "subscriptionTierId" IS NULL;
    `);

    // ── Seed super admin (only if no super admin exists) ─────────────────────
    const existing = await client.query(
      `SELECT id FROM "User" WHERE role = 'SUPER_ADMIN' LIMIT 1`
    );
    if (existing.rowCount === 0) {
      const passwordHash = await bcrypt.hash("SuperAdmin123!", 12);
      const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      await client.query(`
        INSERT INTO "User" (
          "id", "email", "password", "role", "accountStatus",
          "firstName", "lastName", "displayName", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, 'SUPER_ADMIN', 'ACTIVE', 'Super', 'Admin', 'Super Admin', NOW(), NOW())
        ON CONFLICT ("email") DO NOTHING;
      `, [id, "superadmin@example.com", passwordHash]);
      console.log("🌱 [MIGRATE] Super admin created  →  superadmin@example.com / SuperAdmin123!");
    } else {
      console.log("🌱 [MIGRATE] Super admin already exists — skipping seed");
    }

    // ── Seed mock accounts ───────────────────────────────────────────────────
    const defaultPassword = await bcrypt.hash("Password123!", 12);

    // Platform Admin
    await client.query(`
      INSERT INTO "User" ("id", "email", "password", "role", "accountStatus", "firstName", "lastName", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, 'admin@example.com', $1, 'ADMIN', 'ACTIVE', 'Platform', 'Admin', NOW(), NOW())
      ON CONFLICT ("email") DO NOTHING;
    `, [defaultPassword]);

    // Mock Tenant
    const tenantId = 'mock-tenant-id';
    await client.query(`
      INSERT INTO "Tenant" ("id", "name", "subscriptionStatus", "createdAt", "updatedAt")
      VALUES ($1, 'Gladiator Pro', 'ACTIVE', NOW(), NOW())
      ON CONFLICT ("id") DO NOTHING;
    `, [tenantId]);

    // Mock Site
    const siteId = 'mock-site-id';
    await client.query(`
      INSERT INTO "Site" ("id", "tenantId", "name", "address", "createdAt", "updatedAt")
      VALUES ($1, $2, 'Main Office Complex', '123 Business Rd', NOW(), NOW())
      ON CONFLICT ("id") DO NOTHING;
    `, [siteId, tenantId]);

    // Tenant Manager
    await client.query(`
      INSERT INTO "User" ("id", "email", "password", "role", "accountStatus", "firstName", "lastName", "tenantId", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, 'manager@example.com', $1, 'MANAGER', 'ACTIVE', 'Tenant', 'Manager', $2, NOW(), NOW())
      ON CONFLICT ("email") DO NOTHING;
    `, [defaultPassword, tenantId]);

    // Site Manager
    await client.query(`
      INSERT INTO "User" ("id", "email", "password", "role", "accountStatus", "firstName", "lastName", "tenantId", "siteId", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, 'sitemanager@example.com', $1, 'SITE_MANAGER', 'ACTIVE', 'Site', 'Supervisor', $2, $3, NOW(), NOW())
      ON CONFLICT ("email") DO NOTHING;
    `, [defaultPassword, tenantId, siteId]);

    // Security Guard
    await client.query(`
      INSERT INTO "User" ("id", "email", "password", "role", "accountStatus", "firstName", "lastName", "tenantId", "siteId", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, 'guard@example.com', $1, 'GUARD', 'ACTIVE', 'Security', 'Guard', $2, $3, NOW(), NOW())
      ON CONFLICT ("email") DO NOTHING;
    `, [defaultPassword, tenantId, siteId]);

  } catch (err: any) {
    console.error("❌ [MIGRATE] Migration failed:", err.message);
    throw err; // re-throw so server startup aborts — don't run a broken app
  } finally {
    client.release();
    await pool.end();
  }
}
