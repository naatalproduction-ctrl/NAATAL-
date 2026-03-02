// ============================================
// Contrôleur Boutique
// ============================================
const { query } = require('../config/database');

// Récupérer tous les produits
const getAllBoutiqueItems = async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM boutique_items 
      ORDER BY display_order ASC, created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erreur getAllBoutiqueItems:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Récupérer un produit par ID
const getBoutiqueItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM boutique_items WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Produit non trouvé' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erreur getBoutiqueItemById:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Créer un produit
const createBoutiqueItem = async (req, res) => {
  try {
    const { 
      name, price, currency, description, features,
      image_url, purchase_url, color, status, display_order 
    } = req.body;
    
    const result = await query(`
      INSERT INTO boutique_items 
      (name, price, currency, description, features, image_url, purchase_url, color, status, display_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [name, price, currency || 'EUR', description, JSON.stringify(features || []), image_url, purchase_url, color, status || 'active', display_order || 0]);
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erreur createBoutiqueItem:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Mettre à jour un produit
const updateBoutiqueItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, price, currency, description, features,
      image_url, purchase_url, color, status, display_order 
    } = req.body;
    
    const result = await query(`
      UPDATE boutique_items SET
        name = COALESCE($1, name),
        price = COALESCE($2, price),
        currency = COALESCE($3, currency),
        description = COALESCE($4, description),
        features = COALESCE($5, features),
        image_url = COALESCE($6, image_url),
        purchase_url = COALESCE($7, purchase_url),
        color = COALESCE($8, color),
        status = COALESCE($9, status),
        display_order = COALESCE($10, display_order),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `, [name, price, currency, description, features ? JSON.stringify(features) : null, image_url, purchase_url, color, status, display_order, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Produit non trouvé' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erreur updateBoutiqueItem:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Supprimer un produit
const deleteBoutiqueItem = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM boutique_items WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Produit non trouvé' });
    }
    
    res.json({ success: true, message: 'Produit supprimé' });
  } catch (error) {
    console.error('Erreur deleteBoutiqueItem:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Récupérer les produits actifs (pour le site public)
const getActiveBoutiqueItems = async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM boutique_items 
      WHERE status = 'active'
      ORDER BY display_order ASC, created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erreur getActiveBoutiqueItems:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

module.exports = {
  getAllBoutiqueItems,
  getBoutiqueItemById,
  createBoutiqueItem,
  updateBoutiqueItem,
  deleteBoutiqueItem,
  getActiveBoutiqueItems
};
