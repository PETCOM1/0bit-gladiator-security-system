import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL, max: 1 });

async function run() {
  await pool.query('UPDATE "User" SET "tenantId" = $1 WHERE email = $2', ['mock-tenant-id', 'munyadziwapetrus16@gmail.com']);
  console.log("Updated munyadziwapetrus16@gmail.com to mock-tenant-id");
  await pool.end();
}

run();
