// ============================================
// Contrôleur Prospection Google Maps
// ============================================
const { query } = require('../config/database');
const https = require('https');

// Helper: requête Serper
const serperRequest = (path, postData) => {
  const SERPER_KEY = process.env.SERPER_API_KEY;
  return new Promise((resolve) => {
    const options = {
      hostname: 'google.serper.dev',
      path,
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const request = https.request(options, (resp) => {
      let data = '';
      resp.on('data', chunk => data += chunk);
      resp.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve({}); }
      });
    });

    request.on('error', (e) => {
      console.error('Erreur Serper:', e);
      resolve({});
    });

    request.write(postData);
    request.end();
  });
};

const serperKeyMissing = (res) => {
  if (process.env.SERPER_API_KEY) return false;
  res.status(503).json({ success: false, error: 'Clé Serper non configurée sur le serveur' });
  return true;
};

// Recherche Google Maps via Serper API
const scrapeGoogleMaps = async (req, res) => {
  try {
    const { searchQuery, location, limit = 10 } = req.body;

    if (!searchQuery) {
      return res.status(400).json({ success: false, error: 'Requête de recherche requise' });
    }

    if (serperKeyMissing(res)) return;

    const fullQuery = location ? `${searchQuery} ${location}` : searchQuery;
    const postData = JSON.stringify({ q: fullQuery, num: parseInt(limit), gl: 'ci', hl: 'fr' });

    const results = await serperRequest('/maps', postData);

    const prospects = (results.places || []).slice(0, parseInt(limit)).map(place => ({
      name: place.title || '',
      address: place.address || '',
      rating: place.rating || null,
      reviews_count: place.ratingCount || 0,
      category: place.category || '',
      place_id: place.cid || place.placeId || `serper_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      phone: place.phoneNumber || '',
      website: place.website || '',
      email: ''
    }));

    res.json({
      success: true,
      data: prospects,
      total: prospects.length,
      query: fullQuery,
      source: 'maps'
    });
  } catch (error) {
    console.error('Erreur scraping maps:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Recherche Google Web via Serper API
const searchGoogle = async (req, res) => {
  try {
    const { searchQuery, location, limit = 10 } = req.body;

    if (!searchQuery) {
      return res.status(400).json({ success: false, error: 'Requête de recherche requise' });
    }

    if (serperKeyMissing(res)) return;

    const fullQuery = location ? `${searchQuery} ${location}` : searchQuery;
    const postData = JSON.stringify({ q: fullQuery, num: parseInt(limit), gl: 'ci', hl: 'fr' });

    const results = await serperRequest('/search', postData);

    // Extraire les résultats organiques
    const organic = (results.organic || []).slice(0, parseInt(limit)).map(item => ({
      name: item.title || '',
      address: item.snippet || '',
      rating: null,
      reviews_count: 0,
      category: 'Google Search',
      place_id: `google_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      phone: '',
      website: item.link || '',
      email: ''
    }));

    // Extraire aussi les knowledge graph / places si présents
    const places = (results.places || []).map(place => ({
      name: place.title || '',
      address: place.address || '',
      rating: place.rating || null,
      reviews_count: place.ratingCount || 0,
      category: place.category || 'Google Search',
      place_id: place.cid || place.placeId || `google_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      phone: place.phoneNumber || '',
      website: place.website || '',
      email: ''
    }));

    const prospects = [...places, ...organic].slice(0, parseInt(limit));

    res.json({
      success: true,
      data: prospects,
      total: prospects.length,
      query: fullQuery,
      source: 'google'
    });
  } catch (error) {
    console.error('Erreur recherche Google:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Sauvegarder un prospect
const saveProspect = async (req, res) => {
  try {
    const { name, address, phone, website, email, rating, reviews_count, category, place_id, search_query, location } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Le nom est requis' });
    }

    const result = await query(`
      INSERT INTO prospects (name, address, phone, website, email, rating, reviews_count, category, place_id, search_query, location)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (place_id) DO UPDATE SET
        name = EXCLUDED.name,
        address = EXCLUDED.address,
        phone = COALESCE(EXCLUDED.phone, prospects.phone),
        website = COALESCE(EXCLUDED.website, prospects.website),
        email = COALESCE(EXCLUDED.email, prospects.email),
        rating = EXCLUDED.rating,
        reviews_count = EXCLUDED.reviews_count
      RETURNING *
    `, [name, address, phone, website, email, rating, reviews_count, category, place_id || `manual_${Date.now()}`, search_query, location]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erreur sauvegarde prospect:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Sauvegarder plusieurs prospects
const saveMultipleProspects = async (req, res) => {
  try {
    const { prospects } = req.body;
    if (!prospects || !Array.isArray(prospects)) {
      return res.status(400).json({ success: false, error: 'Liste de prospects requise' });
    }

    const saved = [];
    for (const p of prospects) {
      try {
        const result = await query(`
          INSERT INTO prospects (name, address, phone, website, email, rating, reviews_count, category, place_id, search_query, location)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (place_id) DO NOTHING
          RETURNING *
        `, [p.name, p.address, p.phone, p.website, p.email, p.rating, p.reviews_count, p.category, p.place_id || `manual_${Date.now()}_${Math.random()}`, p.search_query, p.location]);
        if (result.rows[0]) saved.push(result.rows[0]);
      } catch (e) { /* skip duplicates */ }
    }

    res.json({ success: true, data: saved, count: saved.length });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Récupérer tous les prospects
const getAllProspects = async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM prospects';
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

// Mettre à jour un prospect
const updateProspect = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, website, email, status, notes, channel, address } = req.body;

    const result = await query(`
      UPDATE prospects
      SET name = COALESCE($1, name),
          phone = COALESCE($2, phone),
          website = COALESCE($3, website),
          email = COALESCE($4, email),
          status = COALESCE($5, status),
          notes = COALESCE($6, notes),
          channel = COALESCE($7, channel),
          address = COALESCE($8, address)
      WHERE id = $9
      RETURNING *
    `, [name, phone, website, email, status, notes, channel, address, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Prospect non trouvé' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Supprimer un prospect
const deleteProspect = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM prospects WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Prospect non trouvé' });
    }
    res.json({ success: true, message: 'Prospect supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Stats prospects
const getProspectsStats = async (req, res) => {
  try {
    const total = await query('SELECT COUNT(*) as count FROM prospects');
    const byStatus = await query('SELECT status, COUNT(*) as count FROM prospects GROUP BY status');
    res.json({
      success: true,
      data: {
        total: parseInt(total.rows[0].count),
        byStatus: byStatus.rows
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

// Convertir un prospect en lead
const convertToLead = async (req, res) => {
  try {
    const { id } = req.params;
    const prospect = await query('SELECT * FROM prospects WHERE id = $1', [id]);

    if (prospect.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Prospect non trouvé' });
    }

    const p = prospect.rows[0];
    const lead = await query(`
      INSERT INTO leads (name, email, phone, company, service, source, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [p.name, p.email, p.phone, p.name, p.category, 'prospection', `Converti depuis prospection. Adresse: ${p.address}`]);

    await query("UPDATE prospects SET status = 'converti' WHERE id = $1", [id]);

    res.json({ success: true, data: lead.rows[0], message: 'Prospect converti en lead' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur serveur interne' });
  }
};

module.exports = {
  scrapeGoogleMaps,
  searchGoogle,
  saveProspect,
  saveMultipleProspects,
  getAllProspects,
  updateProspect,
  deleteProspect,
  getProspectsStats,
  convertToLead
};
