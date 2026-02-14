// ============================================
// Contrôleur d'Authentification
// ============================================
const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'REDACTED';
const JWT_EXPIRES = '24h';

// Connexion admin
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nom d\'utilisateur et mot de passe requis' 
      });
    }
    
    // Chercher l'utilisateur
    const result = await query(
      'SELECT * FROM admins WHERE username = $1 AND is_active = true',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Identifiants incorrects' });
    }
    
    const admin = result.rows[0];
    
    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Identifiants incorrects' });
    }
    
    // Mettre à jour last_login
    await query('UPDATE admins SET last_login = NOW() WHERE id = $1', [admin.id]);
    
    // Générer le token JWT
    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Vérifier le token
const verifyToken = async (req, res) => {
  try {
    // L'utilisateur est déjà vérifié par le middleware auth
    res.json({ success: true, data: req.admin });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Changer le mot de passe
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.admin.id;
    
    // Récupérer l'admin
    const result = await query('SELECT * FROM admins WHERE id = $1', [adminId]);
    const admin = result.rows[0];
    
    // Vérifier l'ancien mot de passe
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Mot de passe actuel incorrect' });
    }
    
    // Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Mettre à jour
    await query('UPDATE admins SET password = $1 WHERE id = $2', [hashedPassword, adminId]);
    
    res.json({ success: true, message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Créer un nouvel admin (superadmin uniquement)
const createAdmin = async (req, res) => {
  try {
    if (req.admin.role !== 'superadmin') {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    const { username, email, password, role } = req.body;
    
    // Vérifier si l'utilisateur existe
    const existing = await query(
      'SELECT * FROM admins WHERE username = $1 OR email = $2',
      [username, email]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Utilisateur ou email déjà existant' });
    }
    
    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Créer l'admin
    const result = await query(`
      INSERT INTO admins (username, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, role, is_active, created_at
    `, [username, email, hashedPassword, role || 'admin']);
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Lister tous les admins (superadmin uniquement)
const getAllAdmins = async (req, res) => {
  try {
    if (req.admin.role !== 'superadmin') {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    const result = await query(`
      SELECT id, username, email, role, is_active, last_login, created_at
      FROM admins
      ORDER BY created_at DESC
    `);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Modifier un admin (superadmin uniquement)
const updateAdmin = async (req, res) => {
  try {
    if (req.admin.role !== 'superadmin') {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    const { id } = req.params;
    const { username, email, role, is_active, password } = req.body;
    
    // Vérifier que l'admin existe
    const existing = await query('SELECT * FROM admins WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
    
    // Ne pas permettre de se désactiver soi-même
    if (parseInt(id) === req.admin.id && is_active === false) {
      return res.status(400).json({ success: false, error: 'Vous ne pouvez pas vous désactiver vous-même' });
    }
    
    // Construire la requête de mise à jour
    let updateQuery = `
      UPDATE admins SET 
        username = COALESCE($1, username),
        email = COALESCE($2, email),
        role = COALESCE($3, role),
        is_active = COALESCE($4, is_active)
    `;
    let params = [username, email, role, is_active];
    
    // Si un nouveau mot de passe est fourni
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateQuery += `, password = $5 WHERE id = $6 RETURNING id, username, email, role, is_active, created_at`;
      params.push(hashedPassword, id);
    } else {
      updateQuery += ` WHERE id = $5 RETURNING id, username, email, role, is_active, created_at`;
      params.push(id);
    }
    
    const result = await query(updateQuery, params);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Supprimer un admin (superadmin uniquement)
const deleteAdmin = async (req, res) => {
  try {
    if (req.admin.role !== 'superadmin') {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    
    const { id } = req.params;
    
    // Ne pas permettre de se supprimer soi-même
    if (parseInt(id) === req.admin.id) {
      return res.status(400).json({ success: false, error: 'Vous ne pouvez pas vous supprimer vous-même' });
    }
    
    // Vérifier que l'admin existe
    const existing = await query('SELECT * FROM admins WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }
    
    await query('DELETE FROM admins WHERE id = $1', [id]);
    
    res.json({ success: true, message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  login,
  verifyToken,
  changePassword,
  createAdmin,
  getAllAdmins,
  updateAdmin,
  deleteAdmin
};
