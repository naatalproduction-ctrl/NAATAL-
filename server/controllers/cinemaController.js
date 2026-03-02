// ============================================
// Contrôleur Cinéma
// ============================================
const { query } = require('../config/database');

// Récupérer tous les films
const getAllCinemaItems = async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM cinema_items 
      ORDER BY display_order ASC, created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erreur getAllCinemaItems:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Récupérer un film par ID
const getCinemaItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM cinema_items WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Film non trouvé' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erreur getCinemaItemById:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Créer un film
const createCinemaItem = async (req, res) => {
  try {
    const { 
      title, year, director, genre, duration, 
      description, video_url, poster_url, trailer_url, cover_url,
      status, display_order 
    } = req.body;
    
    const result = await query(`
      INSERT INTO cinema_items 
      (title, year, director, genre, duration, description, video_url, poster_url, trailer_url, cover_url, status, display_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [title, year, director, genre, duration, description, video_url, poster_url, trailer_url, cover_url, status || 'draft', display_order || 0]);
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erreur createCinemaItem:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Mettre à jour un film
const updateCinemaItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, year, director, genre, duration, 
      description, video_url, poster_url, trailer_url, cover_url,
      status, display_order 
    } = req.body;
    
    const result = await query(`
      UPDATE cinema_items SET
        title = COALESCE($1, title),
        year = COALESCE($2, year),
        director = COALESCE($3, director),
        genre = COALESCE($4, genre),
        duration = COALESCE($5, duration),
        description = COALESCE($6, description),
        video_url = COALESCE($7, video_url),
        poster_url = COALESCE($8, poster_url),
        trailer_url = COALESCE($9, trailer_url),
        cover_url = COALESCE($10, cover_url),
        status = COALESCE($11, status),
        display_order = COALESCE($12, display_order),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `, [title, year, director, genre, duration, description, video_url, poster_url, trailer_url, cover_url, status, display_order, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Film non trouvé' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erreur updateCinemaItem:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Supprimer un film
const deleteCinemaItem = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM cinema_items WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Film non trouvé' });
    }
    
    res.json({ success: true, message: 'Film supprimé' });
  } catch (error) {
    console.error('Erreur deleteCinemaItem:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Récupérer les films publiés (pour le site public)
const getPublishedCinemaItems = async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM cinema_items 
      WHERE status = 'published'
      ORDER BY display_order ASC, year DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erreur getPublishedCinemaItems:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

module.exports = {
  getAllCinemaItems,
  getCinemaItemById,
  createCinemaItem,
  updateCinemaItem,
  deleteCinemaItem,
  getPublishedCinemaItems
};
