// ============================================
// Contrôleur des Messages
// ============================================
const { query } = require('../config/database');

// Récupérer tous les messages
const getAllMessages = async (req, res) => {
  try {
    const { archived } = req.query;
    const isArchived = archived === 'true';
    
    const result = await query(`
      SELECT * FROM messages
      WHERE is_archived = $1
      ORDER BY created_at DESC
    `, [isArchived]);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Récupérer un message par ID
const getMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM messages WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Message non trouvé' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Créer un nouveau message (depuis le formulaire de contact)
const createMessage = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nom, email et message sont requis' 
      });
    }
    
    const result = await query(`
      INSERT INTO messages (name, email, phone, subject, message)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, email, phone, subject, message]);
    
    res.status(201).json({ 
      success: true, 
      data: result.rows[0], 
      message: 'Message envoyé avec succès' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Marquer un message comme lu
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      UPDATE messages SET is_read = true WHERE id = $1 RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Message non trouvé' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Archiver un message
const archiveMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      UPDATE messages SET is_archived = true WHERE id = $1 RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Message non trouvé' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Message archivé' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Supprimer un message
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM messages WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Message non trouvé' });
    }
    res.json({ success: true, message: 'Message supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Supprimer tous les messages archivés
const deleteAllArchived = async (req, res) => {
  try {
    const result = await query('DELETE FROM messages WHERE is_archived = true');
    res.json({ success: true, message: `${result.rowCount} message(s) supprimé(s)` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Statistiques des messages
const getMessagesStats = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_read = false) as unread,
        COUNT(*) FILTER (WHERE is_archived = true) as archived,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as this_week
      FROM messages
    `);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllMessages,
  getMessageById,
  createMessage,
  markAsRead,
  archiveMessage,
  deleteMessage,
  deleteAllArchived,
  getMessagesStats
};
