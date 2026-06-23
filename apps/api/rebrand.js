import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL, max: 1 });

async function run() {
  await pool.query('UPDATE "Tenant" SET name = $1 WHERE name = $2', ['Gladiator Pro', 'SecureGuard Solutions']);
  await pool.query('UPDATE "SystemSetting" SET value = $1 WHERE key = $2', ['Gladiator Pro', 'app_name']);
  console.log("Database updated to Gladiator Pro");
  await pool.end();
}

run();
