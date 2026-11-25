
import pg from 'pg';
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const { Pool } = pg;

const caCertificate = fs.readFileSync(
    path.resolve('cert/supabase-ca.crt'),
    'utf8'
);

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    ssl: {
        ca: caCertificate,
        rejectUnauthorized: true
    },

    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
});

pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
});

export default pool;

