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

// Créer un lead (public - depuis le site ou admin)
const createLead = async (req, res) => {
  try {
    const { name, email, phone, phone2, phone3, company, service, budget, message, source, channel, status, notes } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Le nom est requis' });
    }

    const result = await query(`
      INSERT INTO leads (name, email, phone, phone2, phone3, company, service, budget, message, source, channel, status, notes, sent_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, COALESCE($12, 'nouveau'), $13, $14)
      RETURNING *
    `, [name, email, phone, phone2, phone3, company, service, budget, message, source || 'site', channel || 'whatsapp', status, notes, channel ? new Date() : null]);

    res.status(201).json({ success: true, data: result.rows[0], message: 'Lead créé avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Mettre à jour un lead
const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, phone2, phone3, company, service, budget, message, source, status, notes, channel, rdv_date, relance_count } = req.body;

    const result = await query(`
      UPDATE leads
      SET name = COALESCE($1, name),
          email = COALESCE($2, email),
          phone = COALESCE($3, phone),
          phone2 = COALESCE($4, phone2),
          phone3 = COALESCE($5, phone3),
          company = COALESCE($6, company),
          service = COALESCE($7, service),
          budget = COALESCE($8, budget),
          message = COALESCE($9, message),
          source = COALESCE($10, source),
          status = COALESCE($11, status),
          notes = COALESCE($12, notes),
          channel = COALESCE($13, channel),
          rdv_date = COALESCE($14, rdv_date),
          relance_count = COALESCE($15, relance_count)
      WHERE id = $16
      RETURNING *
    `, [name, email, phone, phone2, phone3, company, service, budget, message, source, status, notes, channel, rdv_date, relance_count, id]);

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
    const byChannel = await query(`
      SELECT channel, COUNT(*) as count FROM leads WHERE channel IS NOT NULL GROUP BY channel ORDER BY count DESC
    `);
    const thisWeek = await query(`
      SELECT COUNT(*) as count FROM leads WHERE created_at > date_trunc('week', CURRENT_DATE)
    `);
    const weeklyByDay = await query(`
      SELECT EXTRACT(DOW FROM created_at) as day, COUNT(*) as count
      FROM leads
      WHERE created_at > date_trunc('week', CURRENT_DATE)
      GROUP BY EXTRACT(DOW FROM created_at)
      ORDER BY day
    `);

    res.json({
      success: true,
      data: {
        total: parseInt(total.rows[0].count),
        recent: parseInt(recent.rows[0].count),
        thisWeek: parseInt(thisWeek.rows[0].count),
        byStatus: byStatus.rows,
        byChannel: byChannel.rows,
        weeklyByDay: weeklyByDay.rows
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
