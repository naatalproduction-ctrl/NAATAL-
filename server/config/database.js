// ============================================
// Configuration PostgreSQL
// ============================================
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'naatal_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 30000,
});

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ Connecté à PostgreSQL');
  }
});

pool.on('error', (err) => {
  console.error('❌ Erreur PostgreSQL inattendue:', err.message);
});

// Helper pour les requetes
const query = async (text, params) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ Query Error:', error.message);
    }
    throw error;
  }
};

module.exports = {
  pool,
  query
};
