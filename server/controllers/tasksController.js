// ============================================
// Contrôleur de Tâches
// ============================================
const { query } = require('../config/database');

// Récupérer toutes les tâches
const getAllTasks = async (req, res) => {
  try {
    const { status, priority, category } = req.query;

    let queryText = `
      SELECT t.*, a.username as created_by_name
      FROM tasks t
      LEFT JOIN admins a ON t.created_by = a.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      queryText += ` AND t.status = $${paramIndex++}`;
      params.push(status);
    }

    if (priority) {
      queryText += ` AND t.priority = $${paramIndex++}`;
      params.push(priority);
    }

    if (category) {
      queryText += ` AND t.category = $${paramIndex++}`;
      params.push(category);
    }

    queryText += ` ORDER BY
      CASE t.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      CASE t.status
        WHEN 'in_progress' THEN 1
        WHEN 'todo' THEN 2
        WHEN 'done' THEN 3
      END,
      t.created_at DESC`;

    const result = await query(queryText, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Récupérer une tâche par ID
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT t.*, a.username as created_by_name
      FROM tasks t
      LEFT JOIN admins a ON t.created_by = a.id
      WHERE t.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Tâche non trouvée' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Créer une tâche
const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, due_date, assigned_to, category } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Le titre est requis'
      });
    }

    if (status && !['todo', 'in_progress', 'done'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Statut invalide (todo, in_progress ou done)'
      });
    }

    if (priority && !['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return res.status(400).json({
        success: false,
        error: 'Priorité invalide (low, medium, high ou urgent)'
      });
    }

    const result = await query(`
      INSERT INTO tasks (title, description, status, priority, due_date, assigned_to, category, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      title,
      description || null,
      status || 'todo',
      priority || 'medium',
      due_date || null,
      assigned_to || null,
      category || null,
      req.admin.id
    ]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Mettre à jour une tâche
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, due_date, assigned_to, category } = req.body;

    const result = await query(`
      UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        priority = COALESCE($4, priority),
        due_date = COALESCE($5, due_date),
        assigned_to = COALESCE($6, assigned_to),
        category = COALESCE($7, category)
      WHERE id = $8
      RETURNING *
    `, [title, description, status, priority, due_date, assigned_to, category, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Tâche non trouvée' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Supprimer une tâche
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Tâche non trouvée' });
    }

    res.json({ success: true, message: 'Tâche supprimée' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Récupérer les statistiques des tâches
const getStats = async (req, res) => {
  try {
    // Count by status
    const statusResult = await query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'done' THEN 1 END) as done,
        COUNT(CASE WHEN due_date < CURRENT_DATE AND status != 'done' THEN 1 END) as overdue
      FROM tasks
    `);

    // Latest 3 tasks
    const recentResult = await query(`
      SELECT t.*, a.username as created_by_name
      FROM tasks t
      LEFT JOIN admins a ON t.created_by = a.id
      ORDER BY t.created_at DESC
      LIMIT 3
    `);

    const stats = statusResult.rows[0];

    res.json({
      success: true,
      data: {
        total: parseInt(stats.total),
        todo: parseInt(stats.todo),
        in_progress: parseInt(stats.in_progress),
        done: parseInt(stats.done),
        overdue: parseInt(stats.overdue),
        recent: recentResult.rows
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getStats
};
