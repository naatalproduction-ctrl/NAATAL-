// ============================================
// Contrôleur Storyboard
// Gestion des tableaux et éléments (style Freeform)
// ============================================
const { query, pool } = require('../config/database');

// ---- BOARDS ----

// Récupérer tous les storyboards
const getAllBoards = async (req, res) => {
  try {
    const { archived } = req.query;
    const isArchived = archived === 'true';

    const result = await query(`
      SELECT s.*, 
        (SELECT COUNT(*) FROM storyboard_elements WHERE storyboard_id = s.id) as element_count
      FROM storyboards s
      WHERE s.is_archived = $1
      ORDER BY s.is_favorite DESC, s.last_opened_at DESC
    `, [isArchived]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erreur getAllBoards:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Récupérer un storyboard avec ses éléments
const getBoardById = async (req, res) => {
  try {
    const { id } = req.params;

    const boardResult = await query('SELECT * FROM storyboards WHERE id = $1', [id]);
    if (boardResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Storyboard non trouvé' });
    }

    const elementsResult = await query(
      'SELECT * FROM storyboard_elements WHERE storyboard_id = $1 ORDER BY z_index ASC',
      [id]
    );

    // Mettre à jour last_opened_at
    await query('UPDATE storyboards SET last_opened_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);

    const board = boardResult.rows[0];
    board.elements = elementsResult.rows;

    res.json({ success: true, data: board });
  } catch (error) {
    console.error('Erreur getBoardById:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Créer un nouveau storyboard
const createBoard = async (req, res) => {
  try {
    const { title, description, color } = req.body;

    const result = await query(`
      INSERT INTO storyboards (title, description, color)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [title || 'Sans titre', description || null, color || '#007aff']);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erreur createBoard:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Mettre à jour un storyboard
const updateBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, color, thumbnail, zoom, pan_x, pan_y, is_favorite, is_archived } = req.body;

    const result = await query(`
      UPDATE storyboards SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        color = COALESCE($3, color),
        thumbnail = COALESCE($4, thumbnail),
        zoom = COALESCE($5, zoom),
        pan_x = COALESCE($6, pan_x),
        pan_y = COALESCE($7, pan_y),
        is_favorite = COALESCE($8, is_favorite),
        is_archived = COALESCE($9, is_archived),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `, [title, description, color, thumbnail, zoom, pan_x, pan_y, is_favorite, is_archived, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Storyboard non trouvé' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erreur updateBoard:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Dupliquer un storyboard
const duplicateBoard = async (req, res) => {
  try {
    const { id } = req.params;

    const boardResult = await query('SELECT * FROM storyboards WHERE id = $1', [id]);
    if (boardResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Storyboard non trouvé' });
    }

    const original = boardResult.rows[0];
    const newBoard = await query(`
      INSERT INTO storyboards (title, description, color, zoom, pan_x, pan_y)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [`${original.title} (copie)`, original.description, original.color, original.zoom, original.pan_x, original.pan_y]);

    const newBoardId = newBoard.rows[0].id;

    // Copier les éléments
    const elementsResult = await query(
      'SELECT * FROM storyboard_elements WHERE storyboard_id = $1',
      [id]
    );

    for (const el of elementsResult.rows) {
      await query(`
        INSERT INTO storyboard_elements (storyboard_id, element_type, pos_x, pos_y, width, height, content, properties, z_index)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [newBoardId, el.element_type, el.pos_x, el.pos_y, el.width, el.height, el.content, el.properties, el.z_index]);
    }

    // Récupérer le board complet
    const fullBoard = await query('SELECT * FROM storyboards WHERE id = $1', [newBoardId]);
    res.status(201).json({ success: true, data: fullBoard.rows[0] });
  } catch (error) {
    console.error('Erreur duplicateBoard:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Supprimer un storyboard
const deleteBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM storyboards WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Storyboard non trouvé' });
    }

    res.json({ success: true, message: 'Storyboard supprimé' });
  } catch (error) {
    console.error('Erreur deleteBoard:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Statistiques
const getBoardStats = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_boards,
        COUNT(*) FILTER (WHERE is_favorite = true) as favorites,
        COUNT(*) FILTER (WHERE is_archived = true) as archived,
        (SELECT COUNT(*) FROM storyboard_elements) as total_elements
      FROM storyboards
    `);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erreur getBoardStats:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// ---- ELEMENTS ----

// Sauvegarder tous les éléments d'un board (remplacement complet, transactionnel)
const saveElements = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { elements, zoom, pan_x, pan_y } = req.body;

    // Vérifier que le board existe
    const boardCheck = await client.query('SELECT id FROM storyboards WHERE id = $1', [id]);
    if (boardCheck.rows.length === 0) {
      client.release();
      return res.status(404).json({ success: false, error: 'Storyboard non trouvé' });
    }

    await client.query('BEGIN');

    // Supprimer les anciens éléments
    await client.query('DELETE FROM storyboard_elements WHERE storyboard_id = $1', [id]);

    // Insérer les nouveaux éléments
    if (elements && elements.length > 0) {
      // First pass: insert all elements and build clientId -> dbId mapping
      const clientToDbId = {};
      const insertedElements = [];

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        // Extract standard fields, put everything else in properties
        const { type, element_type, x, pos_x, y, pos_y, width, height, content, id: elId, ...rest } = el;
        const properties = { ...rest };
        // Remove undefined values
        Object.keys(properties).forEach(key => {
          if (properties[key] === undefined) delete properties[key];
        });
        const result = await client.query(`
          INSERT INTO storyboard_elements 
          (storyboard_id, element_type, pos_x, pos_y, width, height, content, properties, z_index)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id
        `, [
          id,
          type || element_type,
          x ?? pos_x ?? 0,
          y ?? pos_y ?? 0,
          width || 200,
          height || 200,
          content || null,
          JSON.stringify(properties),
          i,
        ]);
        const dbId = result.rows[0].id;
        if (elId) {
          clientToDbId[elId] = dbId;
        }
        insertedElements.push({ dbId, properties });
      }

      // Second pass: update connectors' sourceId/targetId to use DB IDs
      for (const { dbId, properties } of insertedElements) {
        let needsUpdate = false;
        const updatedProps = { ...properties };

        if (updatedProps.sourceId && clientToDbId[updatedProps.sourceId] !== undefined) {
          updatedProps.sourceId = clientToDbId[updatedProps.sourceId];
          needsUpdate = true;
        }
        if (updatedProps.targetId && clientToDbId[updatedProps.targetId] !== undefined) {
          updatedProps.targetId = clientToDbId[updatedProps.targetId];
          needsUpdate = true;
        }

        if (needsUpdate) {
          await client.query(
            'UPDATE storyboard_elements SET properties = $1 WHERE id = $2',
            [JSON.stringify(updatedProps), dbId]
          );
        }
      }
    }

    // Mettre à jour le zoom et le pan du board
    if (zoom !== undefined || pan_x !== undefined || pan_y !== undefined) {
      await client.query(`
        UPDATE storyboards SET
          zoom = COALESCE($1, zoom),
          pan_x = COALESCE($2, pan_x),
          pan_y = COALESCE($3, pan_y),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [zoom, pan_x, pan_y, id]);
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Éléments sauvegardés' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur saveElements:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  } finally {
    client.release();
  }
};

module.exports = {
  getAllBoards,
  getBoardById,
  createBoard,
  updateBoard,
  duplicateBoard,
  deleteBoard,
  getBoardStats,
  saveElements,
};
