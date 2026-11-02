// ============================================
// Mise à niveau du schéma : projets et pièces jointes
// Usage : npm run db:migrate (peut être relancé sans risque)
// ============================================
require('dotenv').config();
const { pool } = require('../config/database');

const STATEMENTS = [
  `ALTER TABLE projets
    ADD COLUMN IF NOT EXISTS equipe_technique TEXT,
    ADD COLUMN IF NOT EXISTS coproduction VARCHAR(255),
    ADD COLUMN IF NOT EXISTS date_sortie DATE,
    ADD COLUMN IF NOT EXISTS budget_actuel DECIMAL(15,2),
    ADD COLUMN IF NOT EXISTS devise VARCHAR(10) DEFAULT 'FCFA',
    ADD COLUMN IF NOT EXISTS affiche_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS bande_annonce_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS dossier_presse_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS photos_plateau TEXT,
    ADD COLUMN IF NOT EXISTS distributeur VARCHAR(255),
    ADD COLUMN IF NOT EXISTS plateformes TEXT,
    ADD COLUMN IF NOT EXISTS pays_diffusion TEXT,
    ADD COLUMN IF NOT EXISTS created_by INT REFERENCES admins(id) ON DELETE SET NULL`,
  `DO $$
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'attachments' AND column_name = 'file_name'
    ) THEN
      ALTER TABLE attachments RENAME COLUMN file_name TO filename;
    END IF;
  END $$`,
  `ALTER TABLE attachments
    ADD COLUMN IF NOT EXISTS original_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS uploaded_by INT REFERENCES admins(id) ON DELETE SET NULL`,
  'UPDATE attachments SET original_name = filename WHERE original_name IS NULL',
  'ALTER TABLE attachments ALTER COLUMN original_name SET NOT NULL',
];

const main = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const statement of STATEMENTS) {
      await client.query(statement);
    }
    await client.query('COMMIT');
    console.log('Schéma à jour');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

main().catch((error) => {
  console.error('Migration impossible :', error.message);
  process.exit(1);
});
