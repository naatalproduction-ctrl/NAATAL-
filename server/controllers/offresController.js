// ============================================
// Controleur Offres (Packages & Projets ponctuels)
// ============================================
const { query } = require('../config/database');

// Recuperer toutes les offres
const getAllOffres = async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM offres
      ORDER BY display_order ASC, created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erreur getAllOffres:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Recuperer une offre par ID
const getOffreById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM offres WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Offre non trouvee' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erreur getOffreById:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Creer une offre
const createOffre = async (req, res) => {
  try {
    const {
      name, type, target, description, price, period,
      features, not_included, cta, is_featured,
      status, display_order
    } = req.body;

    const result = await query(`
      INSERT INTO offres
      (name, type, target, description, price, period, features, not_included, cta, is_featured, status, display_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      name,
      type || 'package',
      target,
      description,
      price || 0,
      period || '/ mois',
      JSON.stringify(features || []),
      JSON.stringify(not_included || []),
      cta || 'Choisir',
      is_featured || false,
      status || 'active',
      display_order || 0
    ]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erreur createOffre:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Mettre a jour une offre
const updateOffre = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, type, target, description, price, period,
      features, not_included, cta, is_featured,
      status, display_order
    } = req.body;

    const result = await query(`
      UPDATE offres SET
        name = COALESCE($1, name),
        type = COALESCE($2, type),
        target = COALESCE($3, target),
        description = COALESCE($4, description),
        price = COALESCE($5, price),
        period = COALESCE($6, period),
        features = COALESCE($7, features),
        not_included = COALESCE($8, not_included),
        cta = COALESCE($9, cta),
        is_featured = COALESCE($10, is_featured),
        status = COALESCE($11, status),
        display_order = COALESCE($12, display_order),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `, [
      name, type, target, description, price, period,
      features ? JSON.stringify(features) : null,
      not_included ? JSON.stringify(not_included) : null,
      cta, is_featured, status, display_order, id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Offre non trouvee' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erreur updateOffre:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Supprimer une offre
const deleteOffre = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM offres WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Offre non trouvee' });
    }

    res.json({ success: true, message: 'Offre supprimee' });
  } catch (error) {
    console.error('Erreur deleteOffre:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Recuperer les offres actives (site public)
const getActiveOffres = async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM offres
      WHERE status = 'active'
      ORDER BY display_order ASC, created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erreur getActiveOffres:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

module.exports = {
  getAllOffres,
  getOffreById,
  createOffre,
  updateOffre,
  deleteOffre,
  getActiveOffres
};
