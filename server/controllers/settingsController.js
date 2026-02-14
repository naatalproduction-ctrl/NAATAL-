// ============================================
// Contrôleur des Paramètres
// ============================================
const { query } = require('../config/database');

// Récupérer tous les paramètres
const getAllSettings = async (req, res) => {
  try {
    const result = await query('SELECT * FROM settings ORDER BY key');
    
    // Convertir en objet clé-valeur pour plus de facilité
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    
    res.json({ success: true, data: settings, raw: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Récupérer un paramètre par clé
const getSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const result = await query('SELECT * FROM settings WHERE key = $1', [key]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Paramètre non trouvé' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Mettre à jour un paramètre
const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    const result = await query(`
      UPDATE settings SET value = $1 WHERE key = $2 RETURNING *
    `, [value, key]);
    
    if (result.rows.length === 0) {
      // Si le paramètre n'existe pas, le créer
      const insert = await query(`
        INSERT INTO settings (key, value) VALUES ($1, $2) RETURNING *
      `, [key, value]);
      return res.status(201).json({ success: true, data: insert.rows[0] });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Mettre à jour plusieurs paramètres en une fois
const updateMultipleSettings = async (req, res) => {
  try {
    const settings = req.body; // { key1: value1, key2: value2, ... }
    const updated = [];
    
    for (const [key, value] of Object.entries(settings)) {
      const result = await query(`
        INSERT INTO settings (key, value) VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE SET value = $2
        RETURNING *
      `, [key, value]);
      updated.push(result.rows[0]);
    }
    
    res.json({ success: true, data: updated, message: 'Paramètres mis à jour' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Récupérer les infos publiques du site (pour le frontend)
const getPublicSiteInfo = async (req, res) => {
  try {
    const result = await query('SELECT key, value FROM settings');
    
    const siteInfo = {
      name: '',
      slogan: '',
      email: '',
      phone: '',
      address: '',
      social: {}
    };
    
    result.rows.forEach(row => {
      if (row.key === 'site_name') siteInfo.name = row.value;
      if (row.key === 'site_slogan') siteInfo.slogan = row.value;
      if (row.key === 'contact_email') siteInfo.email = row.value;
      if (row.key === 'contact_phone') siteInfo.phone = row.value;
      if (row.key === 'contact_address') siteInfo.address = row.value;
      if (row.key.startsWith('social_')) {
        const network = row.key.replace('social_', '');
        siteInfo.social[network] = row.value;
      }
    });
    
    res.json({ success: true, data: siteInfo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllSettings,
  getSettingByKey,
  updateSetting,
  updateMultipleSettings,
  getPublicSiteInfo
};
