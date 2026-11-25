
import pool from './database.js';

const testDatabaseConnection = async () => {
    try {
        const result = await pool.query('SELECT NOW()');

        console.log('PostgreSQL connected successfully!');
        console.log('Database time:', result.rows[0].now);

    } catch (error) {
        console.error('PostgreSQL connection failed:', error.message);
        throw error;
    }
};

export default testDatabaseConnection;
