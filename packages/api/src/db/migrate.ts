import * as fs from 'fs';
import * as path from 'path';
import { getPool } from './index';

async function migrate(): Promise<void> {
  const pool = getPool();
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Migration completed successfully');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
