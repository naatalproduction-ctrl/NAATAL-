// ============================================
// Controleur des Partenaires
// ============================================
const { query } = require('../config/database');

// Public: partenaires actifs
const getActivePartners = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM partners WHERE is_active = true ORDER BY display_order ASC, created_at DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Admin: tous les partenaires
const getAllPartners = async (req, res) => {
  try {
    const result = await query('SELECT * FROM partners ORDER BY display_order ASC, created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Admin: creer un partenaire
const createPartner = async (req, res) => {
  try {
    const { name, logo_url, website_url, display_order } = req.body;

    if (!name || !logo_url) {
      return res.status(400).json({ success: false, error: 'Nom et logo requis' });
    }

    const result = await query(
      `INSERT INTO partners (name, logo_url, website_url, display_order)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, logo_url, website_url || null, display_order || 0]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Admin: modifier un partenaire
const updatePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, logo_url, website_url, display_order, is_active } = req.body;

    const result = await query(
      `UPDATE partners SET
        name = COALESCE($1, name),
        logo_url = COALESCE($2, logo_url),
        website_url = COALESCE($3, website_url),
        display_order = COALESCE($4, display_order),
        is_active = COALESCE($5, is_active)
       WHERE id = $6 RETURNING *`,
      [name, logo_url, website_url, display_order, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Partenaire non trouve' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Admin: supprimer un partenaire
const deletePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM partners WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Partenaire non trouve' });
    }
    res.json({ success: true, message: 'Partenaire supprime' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

module.exports = {
  getActivePartners,
  getAllPartners,
  createPartner,
  updatePartner,
  deletePartner
};
