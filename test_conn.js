const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function check() {
    const res = await pool.query('SELECT * FROM conversations');
    console.log(res.rows);
    await pool.end();
}
check();
