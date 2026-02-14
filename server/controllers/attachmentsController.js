// ============================================
// Contrôleur des Pièces Jointes
// ============================================
const { query } = require('../config/database');
const path = require('path');
const fs = require('fs');

// Types d'entités autorisés
const ALLOWED_ENTITIES = ['transaction', 'projet'];

// Récupérer les pièces jointes d'une entité
const getAttachments = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    
    if (!ALLOWED_ENTITIES.includes(entityType)) {
      return res.status(400).json({ success: false, error: 'Type d\'entité invalide' });
    }
    
    const result = await query(`
      SELECT a.*, adm.username as uploaded_by_name
      FROM attachments a
      LEFT JOIN admins adm ON a.uploaded_by = adm.id
      WHERE a.entity_type = $1 AND a.entity_id = $2
      ORDER BY a.created_at DESC
    `, [entityType, entityId]);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erreur getAttachments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Uploader un fichier
const uploadAttachment = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    
    if (!ALLOWED_ENTITIES.includes(entityType)) {
      return res.status(400).json({ success: false, error: 'Type d\'entité invalide' });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Aucun fichier fourni' });
    }
    
    const { filename, originalname, mimetype, size, path: filePath } = req.file;
    
    const result = await query(`
      INSERT INTO attachments (entity_type, entity_id, filename, original_name, mime_type, file_size, file_path, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [entityType, entityId, filename, originalname, mimetype, size, filePath, req.admin?.id]);
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erreur uploadAttachment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Supprimer un fichier
const deleteAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer le fichier pour avoir le chemin
    const fileResult = await query('SELECT * FROM attachments WHERE id = $1', [id]);
    
    if (fileResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Fichier non trouvé' });
    }
    
    const attachment = fileResult.rows[0];
    
    // Supprimer le fichier physique
    if (fs.existsSync(attachment.file_path)) {
      fs.unlinkSync(attachment.file_path);
    }
    
    // Supprimer de la base
    await query('DELETE FROM attachments WHERE id = $1', [id]);
    
    res.json({ success: true, message: 'Fichier supprimé' });
  } catch (error) {
    console.error('Erreur deleteAttachment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Télécharger un fichier
const downloadAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query('SELECT * FROM attachments WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Fichier non trouvé' });
    }
    
    const attachment = result.rows[0];
    
    if (!fs.existsSync(attachment.file_path)) {
      return res.status(404).json({ success: false, error: 'Fichier introuvable sur le serveur' });
    }
    
    res.download(attachment.file_path, attachment.original_name);
  } catch (error) {
    console.error('Erreur downloadAttachment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAttachments,
  uploadAttachment,
  deleteAttachment,
  downloadAttachment
};
