// ============================================
// Contrôleur des Médias
// ============================================
const { query } = require('../config/database');

// Récupérer tous les médias avec leurs catégories
const getAllMedias = async (req, res) => {
  try {
    const result = await query(`
      SELECT m.*, c.name as category_name, c.slug as category_slug, c.color as category_color
      FROM medias m
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE m.is_active = true
      ORDER BY c.display_order, m.display_order, m.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Récupérer les médias par catégorie
const getMediasByCategory = async (req, res) => {
  try {
    const { categorySlug } = req.params;
    const result = await query(`
      SELECT m.*, c.name as category_name, c.slug as category_slug
      FROM medias m
      JOIN categories c ON m.category_id = c.id
      WHERE c.slug = $1 AND m.is_active = true
      ORDER BY m.display_order, m.created_at DESC
    `, [categorySlug]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Récupérer un média par ID
const getMediaById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT m.*, c.name as category_name, c.slug as category_slug
      FROM medias m
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE m.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Média non trouvé' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Créer un nouveau média
const createMedia = async (req, res) => {
  try {
    const { name, description, type, url, thumbnail, category_id, featured, display_order } = req.body;
    
    const result = await query(`
      INSERT INTO medias (name, description, type, url, thumbnail, category_id, featured, display_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [name, description, type || 'youtube', url, thumbnail, category_id, featured || false, display_order || 0]);
    
    res.status(201).json({ success: true, data: result.rows[0], message: 'Média créé avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Mettre à jour un média
const updateMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, url, thumbnail, category_id, featured, display_order, is_active } = req.body;
    
    const result = await query(`
      UPDATE medias
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          type = COALESCE($3, type),
          url = COALESCE($4, url),
          thumbnail = COALESCE($5, thumbnail),
          category_id = COALESCE($6, category_id),
          featured = COALESCE($7, featured),
          display_order = COALESCE($8, display_order),
          is_active = COALESCE($9, is_active)
      WHERE id = $10
      RETURNING *
    `, [name, description, type, url, thumbnail, category_id, featured, display_order, is_active, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Média non trouvé' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Média mis à jour' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
    res.status(500).json({ success: false, error: error.message });
  }
};

// Récupérer toutes les catégories
const getAllCategories = async (req, res) => {
  try {
    const result = await query(`
      SELECT c.*, COUNT(m.id) as media_count
      FROM categories c
      LEFT JOIN medias m ON c.id = m.category_id AND m.is_active = true
      GROUP BY c.id
      ORDER BY c.display_order
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Récupérer médias groupés par catégorie (pour l'admin)
const getMediasGroupedByCategory = async (req, res) => {
  try {
    const categories = await query(`
      SELECT * FROM categories ORDER BY display_order
    `);
    
    const medias = await query(`
      SELECT m.*, c.slug as category_slug
      FROM medias m
      LEFT JOIN categories c ON m.category_id = c.id
      ORDER BY m.display_order, m.created_at DESC
    `);
    
    // Grouper les médias par catégorie
    const grouped = categories.rows.map(cat => ({
      ...cat,
      medias: medias.rows.filter(m => m.category_id === cat.id)
    }));
    
    res.json({ success: true, data: grouped });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllMedias,
  getMediasByCategory,
  getMediaById,
  createMedia,
  updateMedia,
  deleteMedia,
  getAllCategories,
  getMediasGroupedByCategory
};
