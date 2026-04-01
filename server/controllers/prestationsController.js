// ============================================
// Contrôleur Prestations
// ============================================
const { query } = require('../config/database');

// Récupérer toutes les prestations
const getAllPrestations = async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM prestations
      ORDER BY display_order ASC, created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erreur getAllPrestations:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Récupérer une prestation par ID
const getPrestationById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM prestations WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Prestation non trouvée' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erreur getPrestationById:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Créer une prestation
const createPrestation = async (req, res) => {
  try {
    const {
      title, description, icon, details,
      image_url, status, display_order
    } = req.body;

    const result = await query(`
      INSERT INTO prestations
      (title, description, icon, details, image_url, status, display_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [title, description, icon || 'video', JSON.stringify(details || []), image_url, status || 'active', display_order || 0]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erreur createPrestation:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Mettre à jour une prestation
const updatePrestation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, description, icon, details,
      image_url, status, display_order
    } = req.body;

    const result = await query(`
      UPDATE prestations SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        icon = COALESCE($3, icon),
        details = COALESCE($4, details),
        image_url = COALESCE($5, image_url),
        status = COALESCE($6, status),
        display_order = COALESCE($7, display_order),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [title, description, icon, details ? JSON.stringify(details) : null, image_url, status, display_order, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Prestation non trouvée' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erreur updatePrestation:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Supprimer une prestation
const deletePrestation = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM prestations WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Prestation non trouvée' });
    }

    res.json({ success: true, message: 'Prestation supprimée' });
  } catch (error) {
    console.error('Erreur deletePrestation:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Récupérer les prestations actives (pour le site public)
const getActivePrestations = async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM prestations
      WHERE status = 'active'
      ORDER BY display_order ASC, created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erreur getActivePrestations:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

module.exports = {
  getAllPrestations,
  getPrestationById,
  createPrestation,
  updatePrestation,
  deletePrestation,
  getActivePrestations
};
