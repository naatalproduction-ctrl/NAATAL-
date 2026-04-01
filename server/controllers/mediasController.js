// ============================================
// Contrôleur des Médias
// ============================================
const { query } = require('../config/database');

// Récupérer tous les médias
const getAllMedias = async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM medias
      WHERE is_active = true
      ORDER BY display_order, created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Récupérer un média par ID
const getMediaById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM medias WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Média non trouvé' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Créer un nouveau média
const createMedia = async (req, res) => {
  try {
    const { name, description, type, url, thumbnail, featured, display_order } = req.body;

    const result = await query(`
      INSERT INTO medias (name, description, type, url, thumbnail, featured, display_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [name, description, type || 'youtube', url, thumbnail, featured || false, display_order || 0]);

    res.status(201).json({ success: true, data: result.rows[0], message: 'Média créé avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Mettre à jour un média
const updateMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, url, thumbnail, featured, display_order, is_active } = req.body;

    const result = await query(`
      UPDATE medias
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          type = COALESCE($3, type),
          url = COALESCE($4, url),
          thumbnail = COALESCE($5, thumbnail),
          featured = COALESCE($6, featured),
          display_order = COALESCE($7, display_order),
          is_active = COALESCE($8, is_active)
      WHERE id = $9
      RETURNING *
    `, [name, description, type, url, thumbnail, featured, display_order, is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Média non trouvé' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Média mis à jour' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Supprimer un média
const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM medias WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Média non trouvé' });
    }
    res.json({ success: true, message: 'Média supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

module.exports = {
  getAllMedias,
  getMediaById,
  createMedia,
  updateMedia,
  deleteMedia
};
