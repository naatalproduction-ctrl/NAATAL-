// ============================================
// Création d'un compte administrateur
// Usage : ADMIN_PASSWORD='...' npm run admin:create -- <identifiant> <email>
// ============================================
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const main = async () => {
  const [username, email] = process.argv.slice(2);
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !email || !password) {
    console.error("Usage : ADMIN_PASSWORD='...' npm run admin:create -- <identifiant> <email>");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    "INSERT INTO admins (username, email, password, role) VALUES ($1, $2, $3, 'superadmin')",
    [username, email, hash]
  );
  await pool.end();
  console.log(`Compte ${username} créé`);
};

main().catch((error) => {
  console.error('Création impossible :', error.message);
  process.exit(1);
});
