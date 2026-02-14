// ============================================
// Contrôleur de Comptabilité
// ============================================
const { query } = require('../config/database');

// Catégories prédéfinies
const CATEGORIES = {
  revenu: [
    'Production vidéo',
    'Production cinéma',
    'Publicité',
    'Corporate',
    'Documentaire',
    'Location matériel',
    'Post-production',
    'Consulting',
    'Autre revenu'
  ],
  depense: [
    'Matériel',
    'Location équipement',
    'Salaires',
    'Sous-traitance',
    'Transport',
    'Restauration',
    'Hébergement',
    'Logiciels',
    'Marketing',
    'Loyer',
    'Électricité',
    'Internet',
    'Assurance',
    'Taxes',
    'Autre dépense'
  ]
};

// Récupérer toutes les transactions
const getAllTransactions = async (req, res) => {
  try {
    const { type, year, month, startDate, endDate, category, limit = 100, offset = 0 } = req.query;
    
    let queryText = `
      SELECT t.*, a.username as created_by_name
      FROM transactions t
      LEFT JOIN admins a ON t.created_by = a.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (type) {
      queryText += ` AND t.type = $${paramIndex++}`;
      params.push(type);
    }
    
    // Filtre par année
    if (year) {
      queryText += ` AND EXTRACT(YEAR FROM t.date) = $${paramIndex++}`;
      params.push(parseInt(year));
    }
    
    // Filtre par mois
    if (month) {
      queryText += ` AND EXTRACT(MONTH FROM t.date) = $${paramIndex++}`;
      params.push(parseInt(month));
    }
    
    // Support legacy date filters
    if (startDate) {
      queryText += ` AND t.date >= $${paramIndex++}`;
      params.push(startDate);
    }
    
    if (endDate) {
      queryText += ` AND t.date <= $${paramIndex++}`;
      params.push(endDate);
    }
    
    if (category) {
      queryText += ` AND t.category = $${paramIndex++}`;
      params.push(category);
    }
    
    queryText += ` ORDER BY t.date DESC, t.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await query(queryText, params);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Récupérer une transaction par ID
const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT t.*, a.username as created_by_name
      FROM transactions t
      LEFT JOIN admins a ON t.created_by = a.id
      WHERE t.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Transaction non trouvée' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Créer une transaction
const createTransaction = async (req, res) => {
  try {
    const { 
      type, category, description, amount, date, 
      client, project, payment_method, reference, notes,
      payment_type, total_project, acompte_number, total_acomptes
    } = req.body;
    
    if (!type || !category || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Type, catégorie et montant sont requis' 
      });
    }
    
    if (!['revenu', 'depense'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Type invalide (revenu ou depense)' 
      });
    }
    
    if (payment_type && !['comptant', 'acompte'].includes(payment_type)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Type de paiement invalide (comptant ou acompte)' 
      });
    }
    
    const result = await query(`
      INSERT INTO transactions (
        type, category, description, amount, date, 
        client, project, payment_method, reference, notes, 
        payment_type, total_project, acompte_number, total_acomptes,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      type, category, description, amount, date || new Date(), 
      client, project, payment_method, reference, notes,
      payment_type || 'comptant', total_project || null, acompte_number || 1, total_acomptes || 1,
      req.admin.id
    ]);
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Mettre à jour une transaction
const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      type, category, description, amount, date, 
      client, project, payment_method, reference, notes,
      payment_type, total_project, acompte_number, total_acomptes
    } = req.body;
    
    console.log('=== updateTransaction ===');
    console.log('id:', id);
    console.log('body:', req.body);
    console.log('total_project from body:', total_project, typeof total_project);
    
    const result = await query(`
      UPDATE transactions SET
        type = COALESCE($1, type),
        category = COALESCE($2, category),
        description = COALESCE($3, description),
        amount = COALESCE($4, amount),
        date = COALESCE($5, date),
        client = COALESCE($6, client),
        project = COALESCE($7, project),
        payment_method = COALESCE($8, payment_method),
        reference = COALESCE($9, reference),
        notes = COALESCE($10, notes),
        payment_type = COALESCE($11, payment_type),
        total_project = COALESCE($12, total_project),
        acompte_number = COALESCE($13, acompte_number),
        total_acomptes = COALESCE($14, total_acomptes)
      WHERE id = $15
      RETURNING *
    `, [
      type, category, description, amount, date, 
      client, project, payment_method, reference, notes,
      payment_type, total_project, acompte_number, total_acomptes,
      id
    ]);
    
    console.log('Update result:', result.rows[0]?.total_project);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Transaction non trouvée' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Supprimer une transaction
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query('DELETE FROM transactions WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Transaction non trouvée' });
    }
    
    res.json({ success: true, message: 'Transaction supprimée' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Récupérer les statistiques
const getStats = async (req, res) => {
  try {
    const { startDate, endDate, year, month } = req.query;
    
    let dateFilter = '';
    const params = [];
    let paramIndex = 1;
    
    if (startDate && endDate) {
      dateFilter = `WHERE date >= $${paramIndex++} AND date <= $${paramIndex++}`;
      params.push(startDate, endDate);
    } else if (year && month) {
      dateFilter = `WHERE EXTRACT(YEAR FROM date) = $${paramIndex++} AND EXTRACT(MONTH FROM date) = $${paramIndex++}`;
      params.push(year, month);
    } else if (year) {
      dateFilter = `WHERE EXTRACT(YEAR FROM date) = $${paramIndex++}`;
      params.push(year);
    }
    
    // Totaux revenus et dépenses
    const totalsResult = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'revenu' THEN amount ELSE 0 END), 0) as total_revenus,
        COALESCE(SUM(CASE WHEN type = 'depense' THEN amount ELSE 0 END), 0) as total_depenses,
        COUNT(CASE WHEN type = 'revenu' THEN 1 END) as count_revenus,
        COUNT(CASE WHEN type = 'depense' THEN 1 END) as count_depenses
      FROM transactions
      ${dateFilter}
    `, params);
    
    // Par catégorie
    const byCategoryResult = await query(`
      SELECT type, category, SUM(amount) as total, COUNT(*) as count
      FROM transactions
      ${dateFilter}
      GROUP BY type, category
      ORDER BY total DESC
    `, params);
    
    // Par mois (pour le graphique)
    const byMonthResult = await query(`
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        COALESCE(SUM(CASE WHEN type = 'revenu' THEN amount ELSE 0 END), 0) as revenus,
        COALESCE(SUM(CASE WHEN type = 'depense' THEN amount ELSE 0 END), 0) as depenses
      FROM transactions
      ${dateFilter}
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `, params);
    
    // Dernières transactions
    const recentResult = await query(`
      SELECT t.*, a.username as created_by_name
      FROM transactions t
      LEFT JOIN admins a ON t.created_by = a.id
      ${dateFilter}
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT 5
    `, params);
    
    const totals = totalsResult.rows[0];
    const balance = parseFloat(totals.total_revenus) - parseFloat(totals.total_depenses);
    
    res.json({
      success: true,
      data: {
        totals: {
          revenus: parseFloat(totals.total_revenus),
          depenses: parseFloat(totals.total_depenses),
          balance: balance,
          countRevenus: parseInt(totals.count_revenus),
          countDepenses: parseInt(totals.count_depenses)
        },
        byCategory: byCategoryResult.rows,
        byMonth: byMonthResult.rows.reverse(),
        recent: recentResult.rows
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Récupérer les catégories
const getCategories = async (req, res) => {
  res.json({ success: true, data: CATEGORIES });
};

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getStats,
  getCategories
};
