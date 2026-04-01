// ============================================
// Contrôleur Leads Power
// ============================================
const { query } = require('../config/database');

// Récupérer tous les leads
const getAllLeads = async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM leads';
    const params = [];

    if (status) {
      sql += ' WHERE status = $1';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';
    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Récupérer un lead par ID
const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM leads WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Lead non trouvé' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Créer un lead (public - depuis le site)
const createLead = async (req, res) => {
  try {
    const { name, email, phone, company, service, budget, message, source } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Le nom est requis' });
    }

    const result = await query(`
      INSERT INTO leads (name, email, phone, company, service, budget, message, source)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [name, email, phone, company, service, budget, message, source || 'site']);

    res.status(201).json({ success: true, data: result.rows[0], message: 'Lead créé avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Mettre à jour un lead
const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, company, service, budget, message, source, status, notes } = req.body;

    const result = await query(`
      UPDATE leads
      SET name = COALESCE($1, name),
          email = COALESCE($2, email),
          phone = COALESCE($3, phone),
          company = COALESCE($4, company),
          service = COALESCE($5, service),
          budget = COALESCE($6, budget),
          message = COALESCE($7, message),
          source = COALESCE($8, source),
          status = COALESCE($9, status),
          notes = COALESCE($10, notes)
      WHERE id = $11
      RETURNING *
    `, [name, email, phone, company, service, budget, message, source, status, notes, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Lead non trouvé' });
    }
    res.json({ success: true, data: result.rows[0], message: 'Lead mis à jour' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Supprimer un lead
const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM leads WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Lead non trouvé' });
    }
    res.json({ success: true, message: 'Lead supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Stats des leads
const getLeadsStats = async (req, res) => {
  try {
    const total = await query('SELECT COUNT(*) as count FROM leads');
    const byStatus = await query(`
      SELECT status, COUNT(*) as count FROM leads GROUP BY status ORDER BY count DESC
    `);
    const recent = await query(`
      SELECT COUNT(*) as count FROM leads WHERE created_at > NOW() - INTERVAL '30 days'
    `);

    res.json({
      success: true,
      data: {
        total: parseInt(total.rows[0].count),
        recent: parseInt(recent.rows[0].count),
        byStatus: byStatus.rows
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

module.exports = {
  getAllLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  getLeadsStats
};
