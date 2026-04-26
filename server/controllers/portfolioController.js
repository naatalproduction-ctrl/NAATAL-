// ============================================
// Contrôleur Portfolio Soukavisuals
// ============================================
const { query } = require('../config/database');

// ============================================
// PROFIL
// ============================================
const getProfile = async (req, res) => {
  try {
    const result = await query('SELECT * FROM portfolio_profile LIMIT 1');
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Profil non trouvé' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const fields = req.body;
    const keys = Object.keys(fields);
    if (keys.length === 0) {
      return res.status(400).json({ success: false, error: 'Aucun champ à mettre à jour' });
    }

    const setClauses = keys.map((key, i) => `${key} = $${i + 1}`);
    const values = keys.map(k => fields[k]);

    const result = await query(
      `UPDATE portfolio_profile SET ${setClauses.join(', ')} WHERE id = (SELECT id FROM portfolio_profile LIMIT 1) RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Profil non trouvé' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ============================================
// STATS
// ============================================
const getStats = async (req, res) => {
  try {
    const result = await query('SELECT * FROM portfolio_stats WHERE is_active = true ORDER BY display_order');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const getAllStats = async (req, res) => {
  try {
    const result = await query('SELECT * FROM portfolio_stats ORDER BY display_order');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const createStat = async (req, res) => {
  try {
    const { value, label, display_order = 0, is_active = true } = req.body;
    const result = await query(
      'INSERT INTO portfolio_stats (value, label, display_order, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
      [value, label, display_order, is_active]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const updateStat = async (req, res) => {
  try {
    const { id } = req.params;
    const { value, label, display_order, is_active } = req.body;
    const result = await query(
      'UPDATE portfolio_stats SET value = COALESCE($1, value), label = COALESCE($2, label), display_order = COALESCE($3, display_order), is_active = COALESCE($4, is_active) WHERE id = $5 RETURNING *',
      [value, label, display_order, is_active, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Stat non trouvée' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const deleteStat = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM portfolio_stats WHERE id = $1', [id]);
    res.json({ success: true, message: 'Stat supprimée' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ============================================
// PROJECTS
// ============================================
const getProjects = async (req, res) => {
  try {
    const result = await query('SELECT * FROM portfolio_projects WHERE is_active = true ORDER BY display_order');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const getAllProjects = async (req, res) => {
  try {
    const result = await query('SELECT * FROM portfolio_projects ORDER BY display_order');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const createProject = async (req, res) => {
  try {
    const { name, category, description, year, image_url, link_url, gradient_from, gradient_to, display_order = 0, is_active = true } = req.body;
    const result = await query(
      `INSERT INTO portfolio_projects (name, category, description, year, image_url, link_url, gradient_from, gradient_to, display_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, category, description, year, image_url, link_url, gradient_from, gradient_to, display_order, is_active]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const keys = Object.keys(fields);
    if (keys.length === 0) return res.status(400).json({ success: false, error: 'Aucun champ' });

    const setClauses = keys.map((k, i) => `${k} = $${i + 1}`);
    const values = [...keys.map(k => fields[k]), id];

    const result = await query(
      `UPDATE portfolio_projects SET ${setClauses.join(', ')} WHERE id = $${keys.length + 1} RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Projet non trouvé' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM portfolio_projects WHERE id = $1', [id]);
    res.json({ success: true, message: 'Projet supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ============================================
// SKILLS
// ============================================
const getSkills = async (req, res) => {
  try {
    const result = await query('SELECT * FROM portfolio_skills WHERE is_active = true ORDER BY display_order');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const getAllSkills = async (req, res) => {
  try {
    const result = await query('SELECT * FROM portfolio_skills ORDER BY display_order');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const createSkill = async (req, res) => {
  try {
    const { name, icon, description, percentage, display_order = 0, is_active = true } = req.body;
    const result = await query(
      'INSERT INTO portfolio_skills (name, icon, description, percentage, display_order, is_active) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, icon, description, percentage, display_order, is_active]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const updateSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const keys = Object.keys(fields);
    if (keys.length === 0) return res.status(400).json({ success: false, error: 'Aucun champ' });

    const setClauses = keys.map((k, i) => `${k} = $${i + 1}`);
    const values = [...keys.map(k => fields[k]), id];

    const result = await query(
      `UPDATE portfolio_skills SET ${setClauses.join(', ')} WHERE id = $${keys.length + 1} RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Skill non trouvé' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const deleteSkill = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM portfolio_skills WHERE id = $1', [id]);
    res.json({ success: true, message: 'Skill supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ============================================
// MARQUEE
// ============================================
const getMarquee = async (req, res) => {
  try {
    const result = await query('SELECT * FROM portfolio_marquee WHERE is_active = true ORDER BY display_order');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const getAllMarquee = async (req, res) => {
  try {
    const result = await query('SELECT * FROM portfolio_marquee ORDER BY display_order');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const createMarquee = async (req, res) => {
  try {
    const { text, display_order = 0, is_active = true } = req.body;
    const result = await query(
      'INSERT INTO portfolio_marquee (text, display_order, is_active) VALUES ($1,$2,$3) RETURNING *',
      [text, display_order, is_active]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const updateMarquee = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, display_order, is_active } = req.body;
    const result = await query(
      'UPDATE portfolio_marquee SET text = COALESCE($1, text), display_order = COALESCE($2, display_order), is_active = COALESCE($3, is_active) WHERE id = $4 RETURNING *',
      [text, display_order, is_active, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Non trouvé' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const deleteMarquee = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM portfolio_marquee WHERE id = $1', [id]);
    res.json({ success: true, message: 'Marquee supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ============================================
// MESSAGES
// ============================================
const getMessages = async (req, res) => {
  try {
    const result = await query('SELECT * FROM portfolio_messages ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const createMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'Nom, email et message requis' });
    }
    const result = await query(
      'INSERT INTO portfolio_messages (name, email, message) VALUES ($1,$2,$3) RETURNING *',
      [name, email, message]
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Message envoyé' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const markMessageRead = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'UPDATE portfolio_messages SET is_read = true WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Message non trouvé' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM portfolio_messages WHERE id = $1', [id]);
    res.json({ success: true, message: 'Message supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// ============================================
// PUBLIC — Tout le portfolio en une requête
// ============================================
const getPublicPortfolio = async (req, res) => {
  try {
    const [profile, stats, projects, skills, marquee] = await Promise.all([
      query('SELECT * FROM portfolio_profile LIMIT 1'),
      query('SELECT * FROM portfolio_stats WHERE is_active = true ORDER BY display_order'),
      query('SELECT * FROM portfolio_projects WHERE is_active = true ORDER BY display_order'),
      query('SELECT * FROM portfolio_skills WHERE is_active = true ORDER BY display_order'),
      query('SELECT * FROM portfolio_marquee WHERE is_active = true ORDER BY display_order'),
    ]);

    res.json({
      success: true,
      data: {
        profile: profile.rows[0] || null,
        stats: stats.rows,
        projects: projects.rows,
        skills: skills.rows,
        marquee: marquee.rows,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

module.exports = {
  getProfile, updateProfile,
  getStats, getAllStats, createStat, updateStat, deleteStat,
  getProjects, getAllProjects, createProject, updateProject, deleteProject,
  getSkills, getAllSkills, createSkill, updateSkill, deleteSkill,
  getMarquee, getAllMarquee, createMarquee, updateMarquee, deleteMarquee,
  getMessages, createMessage, markMessageRead, deleteMessage,
  getPublicPortfolio,
};
