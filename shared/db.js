const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number.parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'lps',
  password: process.env.PGPASSWORD || 'lps_pass',
  database: process.env.PGDATABASE || 'lps_ecommerce',
  ssl: process.env.PGSSL === 'true'
});

async function query(text, params, client) {
  if (client) {
    return client.query(text, params);
  }
  return pool.query(text, params);
}

async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query,
  withTransaction
};
