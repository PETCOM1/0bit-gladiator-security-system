import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL, max: 1 });

async function run() {
  const { rows } = await pool.query('SELECT email, role, "tenantId" FROM "User"');
  console.log(rows);
  await pool.end();
}

run();
