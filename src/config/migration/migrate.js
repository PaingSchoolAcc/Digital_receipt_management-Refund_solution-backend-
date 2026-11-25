import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pool from '../database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const files = fs
      .readdirSync(__dirname)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No .sql migration files found in src/config/migration.');
    }

    for (const file of files) {
      const alreadyApplied = await client.query(
        'SELECT 1 FROM schema_migrations WHERE filename = $1',
        [file]
      );

      if (alreadyApplied.rowCount > 0) {
        console.log(`Skipping already applied migration: ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
      console.log(`Applying migration: ${file}...`);
      await client.query(sql);

      await client.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [file]
      );
    }

    await client.query('COMMIT');
    console.log('All migrations completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed, rolled back changes:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();