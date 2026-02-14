// ============================================
// Controller des Projets
// ============================================
const { pool } = require('../config/database');

// Types et statuts disponibles
const TYPES = ['film', 'court-metrage', 'publicite', 'documentaire', 'clip', 'corporate', 'serie', 'autre'];
const STATUTS = ['en_developpement', 'pre_production', 'production', 'post_production', 'termine', 'diffusion', 'archive'];

// Labels pour affichage
const TYPE_LABELS = {
  'film': 'Long-métrage',
  'court-metrage': 'Court-métrage',
  'publicite': 'Publicité',
  'documentaire': 'Documentaire',
  'clip': 'Clip vidéo',
  'corporate': 'Corporate',
  'serie': 'Série',
  'autre': 'Autre'
};

const STATUT_LABELS = {
  'en_developpement': 'En développement',
  'pre_production': 'Pré-production',
  'production': 'En production',
  'post_production': 'Post-production',
  'termine': 'Terminé',
  'diffusion': 'En diffusion',
  'archive': 'Archivé'
};

// Obtenir les options (types, statuts)
const getOptions = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        types: TYPES.map(t => ({ value: t, label: TYPE_LABELS[t] })),
        statuts: STATUTS.map(s => ({ value: s, label: STATUT_LABELS[s] }))
      }
    });
  } catch (error) {
    console.error('Erreur getOptions:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Obtenir les statistiques des projets
const getStats = async (req, res) => {
  try {
    // Compter par statut
    const byStatut = await pool.query(`
      SELECT statut, COUNT(*) as count 
      FROM projets 
      GROUP BY statut
    `);
    
    // Compter par type
    const byType = await pool.query(`
      SELECT type, COUNT(*) as count 
      FROM projets 
      GROUP BY type
    `);
    
    // Total projets
    const total = await pool.query('SELECT COUNT(*) as count FROM projets');
    
    // Projets en cours (à partir de préproduction: pre_production, production, post_production)
    const enCours = await pool.query(`
      SELECT COUNT(*) as count FROM projets 
      WHERE statut IN ('pre_production', 'production', 'post_production')
    `);
    
    // Projets terminés (terminé ou en diffusion)
    const termines = await pool.query(`
      SELECT COUNT(*) as count FROM projets 
      WHERE statut IN ('termine', 'diffusion')
    `);
    
    // Projets haute priorité (priorite >= 4)
    const hautePriorite = await pool.query(`
      SELECT COUNT(*) as count FROM projets 
      WHERE priorite >= 4
    `);
    
    // Budget total prévu
    const budgetTotal = await pool.query(`
      SELECT 
        COALESCE(SUM(budget_prevu), 0) as budget_prevu,
        COALESCE(SUM(budget_actuel), 0) as budget_actuel
      FROM projets
    `);

    res.json({
      success: true,
      data: {
        total: parseInt(total.rows[0].count),
        en_cours: parseInt(enCours.rows[0].count),
        termines: parseInt(termines.rows[0].count),
        haute_priorite: parseInt(hautePriorite.rows[0].count),
        byStatut: byStatut.rows.reduce((acc, row) => {
          acc[row.statut] = parseInt(row.count);
          return acc;
        }, {}),
        byType: byType.rows.reduce((acc, row) => {
          acc[row.type] = parseInt(row.count);
          return acc;
        }, {}),
        budgetPrevu: parseFloat(budgetTotal.rows[0].budget_prevu),
        budgetActuel: parseFloat(budgetTotal.rows[0].budget_actuel)
      }
    });
  } catch (error) {
    console.error('Erreur getStats projets:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Obtenir tous les projets avec filtres
const getAllProjets = async (req, res) => {
  try {
    const { type, statut, search, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
    
    let query = 'SELECT * FROM projets WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (type) {
      query += ` AND type = $${paramIndex++}`;
      params.push(type);
    }
    
    if (statut) {
      query += ` AND statut = $${paramIndex++}`;
      params.push(statut);
    }
    
    if (search) {
      query += ` AND (titre ILIKE $${paramIndex} OR client ILIKE $${paramIndex} OR realisateur ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    // Validation du tri
    const allowedSortFields = ['created_at', 'titre', 'type', 'statut', 'date_debut', 'progression', 'priorite'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY ${sortField} ${order}`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Erreur getAllProjets:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Obtenir un projet par ID
const getProjetById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('SELECT * FROM projets WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Projet non trouvé' });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur getProjetById:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Créer un nouveau projet
const createProjet = async (req, res) => {
  try {
    const {
      titre, type, statut = 'en_developpement',
      synopsis, logline, genre,
      duree_prevue, format, langue,
      realisateur, producteur, scenariste, directeur_photo, casting, equipe_technique,
      client, production, coproduction,
      date_debut, date_fin_prevue, date_sortie,
      budget_prevu, budget_actuel, devise,
      affiche_url, bande_annonce_url, dossier_presse_url, photos_plateau,
      distributeur, plateformes, pays_diffusion,
      notes, priorite, progression
    } = req.body;
    
    // Validation
    if (!titre || !type) {
      return res.status(400).json({ success: false, error: 'Titre et type sont requis' });
    }
    
    if (!TYPES.includes(type)) {
      return res.status(400).json({ success: false, error: 'Type de projet invalide' });
    }
    
    if (statut && !STATUTS.includes(statut)) {
      return res.status(400).json({ success: false, error: 'Statut invalide' });
    }
    
    // Helper pour convertir en entier
    const toInt = (val) => {
      if (val === '' || val === null || val === undefined) return null;
      const num = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
      return isNaN(num) ? null : num;
    };
    
    const result = await pool.query(`
      INSERT INTO projets (
        titre, type, statut,
        synopsis, logline, genre,
        duree_prevue, format, langue,
        realisateur, producteur, scenariste, directeur_photo, casting, equipe_technique,
        client, production, coproduction,
        date_debut, date_fin_prevue, date_sortie,
        budget_prevu, budget_actuel, devise,
        affiche_url, bande_annonce_url, dossier_presse_url, photos_plateau,
        distributeur, plateformes, pays_diffusion,
        notes, priorite, progression,
        created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35
      ) RETURNING *
    `, [
      titre, type, statut,
      synopsis || null, logline || null, genre || null,
      toInt(duree_prevue), format || null, langue || 'Français',
      realisateur || null, producteur || null, scenariste || null, directeur_photo || null, casting || null, equipe_technique || null,
      client || null, production || 'NAATAL Production', coproduction || null,
      date_debut || null, date_fin_prevue || null, date_sortie || null,
      toInt(budget_prevu), toInt(budget_actuel), devise || 'FCFA',
      affiche_url || null, bande_annonce_url || null, dossier_presse_url || null, photos_plateau || null,
      distributeur || null, plateformes || null, pays_diffusion || null,
      notes || null, toInt(priorite) || 3, toInt(progression) || 0,
      req.admin?.id || null
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Projet créé avec succès',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur createProjet:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Mettre à jour un projet
const updateProjet = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Vérifier que le projet existe
    const existing = await pool.query('SELECT * FROM projets WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Projet non trouvé' });
    }
    
    // Validation type et statut si fournis
    if (updates.type && !TYPES.includes(updates.type)) {
      return res.status(400).json({ success: false, error: 'Type de projet invalide' });
    }
    
    if (updates.statut && !STATUTS.includes(updates.statut)) {
      return res.status(400).json({ success: false, error: 'Statut invalide' });
    }
    
    // Construire la requête de mise à jour dynamiquement
    const allowedFields = [
      'titre', 'type', 'statut', 'synopsis', 'logline', 'genre',
      'duree_prevue', 'format', 'langue',
      'realisateur', 'producteur', 'scenariste', 'directeur_photo', 'casting', 'equipe_technique',
      'client', 'production', 'coproduction',
      'date_debut', 'date_fin_prevue', 'date_sortie',
      'budget_prevu', 'budget_actuel', 'devise',
      'affiche_url', 'bande_annonce_url', 'dossier_presse_url', 'photos_plateau',
      'distributeur', 'plateformes', 'pays_diffusion',
      'notes', 'priorite', 'progression'
    ];
    
    const setClauses = [];
    const values = [];
    let paramIndex = 1;
    
    // Champs qui doivent être des entiers
    const integerFields = ['duree_prevue', 'priorite', 'progression', 'budget_prevu', 'budget_actuel'];
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = $${paramIndex++}`);
        
        let value = updates[field];
        
        // Convertir les champs entiers
        if (integerFields.includes(field)) {
          if (value === '' || value === null) {
            value = null;
          } else {
            // Extraire uniquement les chiffres pour duree_prevue (ex: "30 min" -> 30)
            const numValue = parseInt(String(value).replace(/[^0-9]/g, ''), 10);
            value = isNaN(numValue) ? null : numValue;
          }
        } else {
          value = value === '' ? null : value;
        }
        
        values.push(value);
      }
    }
    
    if (setClauses.length === 0) {
      return res.status(400).json({ success: false, error: 'Aucun champ à mettre à jour' });
    }
    
    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const query = `UPDATE projets SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      message: 'Projet mis à jour avec succès',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur updateProjet:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

// Supprimer un projet
const deleteProjet = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM projets WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Projet non trouvé' });
    }
    
    res.json({
      success: true,
      message: 'Projet supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteProjet:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

module.exports = {
  getOptions,
  getStats,
  getAllProjets,
  getProjetById,
  createProjet,
  updateProjet,
  deleteProjet
};
