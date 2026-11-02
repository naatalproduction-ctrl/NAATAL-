// ============================================
// Copie le contenu public de production dans la base locale
// Usage : npm run db:sync
// Ne lit que l'API publique : rien n'est écrit en production
// ============================================
require('dotenv').config();
const { pool } = require('../config/database');

const API_URL = 'https://naatalstudio.com/api';
const LOCAL_HOSTS = ['localhost', '127.0.0.1'];

const getData = async (endpoint) => {
  const response = await fetch(`${API_URL}${endpoint}`);
  const body = await response.json();
  if (!body.success) throw new Error(`Réponse invalide pour ${endpoint}`);
  return body.data;
};

const replaceTable = async (client, table, rows) => {
  const { rows: columns } = await client.query(
    'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1',
    [table]
  );
  const types = Object.fromEntries(columns.map(column => [column.column_name, column.data_type]));
  const serialize = (key, value) => (
    ['json', 'jsonb'].includes(types[key]) && value !== null ? JSON.stringify(value) : value
  );

  await client.query(`DELETE FROM ${table}`);

  for (const row of rows) {
    const keys = Object.keys(row).filter(key => key in types);
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
    await client.query(
      `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
      keys.map(key => serialize(key, row[key]))
    );
  }

  await client.query(
    `SELECT setval(pg_get_serial_sequence('${table}', 'id'), GREATEST((SELECT MAX(id) FROM ${table}), 1))`
  );
  console.log(`${table} : ${rows.length} ligne(s)`);
};

const main = async () => {
  if (!LOCAL_HOSTS.includes(process.env.DB_HOST || 'localhost') || process.env.NODE_ENV === 'production') {
    throw new Error('cette commande ne fonctionne que sur une base locale');
  }

  const [medias, films, portfolio] = await Promise.all([
    getData('/medias'),
    getData('/cinema/public'),
    getData('/portfolio/public'),
  ]);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await replaceTable(client, 'medias', medias);
    await replaceTable(client, 'cinema_items', films);
    await replaceTable(client, 'portfolio_profile', [portfolio.profile]);
    await replaceTable(client, 'portfolio_stats', portfolio.stats);
    await replaceTable(client, 'portfolio_projects', portfolio.projects);
    await replaceTable(client, 'portfolio_skills', portfolio.skills);
    await replaceTable(client, 'portfolio_marquee', portfolio.marquee);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  await pool.end();
};

main().catch((error) => {
  console.error('Synchronisation impossible :', error.message);
  process.exit(1);
});
