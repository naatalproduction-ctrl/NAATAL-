// ============================================
// Service API - Communication avec le Backend
// ============================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Helper pour les requêtes
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('naatal_token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Une erreur est survenue');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// ============================================
// AUTH API
// ============================================
export const authAPI = {
  login: async (username, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (data.success && data.data.token) {
      localStorage.setItem('naatal_token', data.data.token);
      localStorage.setItem('naatal_admin', JSON.stringify(data.data.user));
    }
    return data;
  },
  
  logout: () => {
    localStorage.removeItem('naatal_token');
    localStorage.removeItem('naatal_admin');
  },
  
  verify: () => request('/auth/verify'),
  
  changePassword: (currentPassword, newPassword) => 
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  
  isAuthenticated: () => {
    return !!localStorage.getItem('naatal_token');
  },
  
  getAdmin: () => {
    const admin = localStorage.getItem('naatal_admin');
    return admin ? JSON.parse(admin) : null;
  }
};

// ============================================
// USERS API (gestion des utilisateurs)
// ============================================
export const usersAPI = {
  // Récupérer tous les utilisateurs
  getAll: () => request('/auth/users'),
  
  // Créer un utilisateur
  create: (userData) => request('/auth/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  
  // Mettre à jour un utilisateur
  update: (id, userData) => request(`/auth/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  }),
  
  // Supprimer un utilisateur
  delete: (id) => request(`/auth/users/${id}`, {
    method: 'DELETE',
  }),
};

// ============================================
// MEDIAS API
// ============================================
export const mediasAPI = {
  // Récupérer tous les médias
  getAll: () => request('/medias'),
  
  // Récupérer les médias groupés par catégorie
  getGrouped: () => request('/medias/grouped'),
  
  // Récupérer les catégories
  getCategories: () => request('/medias/categories'),
  
  // Récupérer les médias par catégorie
  getByCategory: (categorySlug) => request(`/medias/category/${categorySlug}`),
  
  // Récupérer un média par ID
  getById: (id) => request(`/medias/${id}`),
  
  // Créer un média
  create: (mediaData) => request('/medias', {
    method: 'POST',
    body: JSON.stringify(mediaData),
  }),
  
  // Mettre à jour un média
  update: (id, mediaData) => request(`/medias/${id}`, {
    method: 'PUT',
    body: JSON.stringify(mediaData),
  }),
  
  // Supprimer un média
  delete: (id) => request(`/medias/${id}`, {
    method: 'DELETE',
  }),
};

// ============================================
// MESSAGES API
// ============================================
export const messagesAPI = {
  // Récupérer tous les messages
  getAll: (archived = false) => request(`/messages?archived=${archived}`),
  
  // Récupérer les statistiques
  getStats: () => request('/messages/stats'),
  
  // Récupérer un message
  getById: (id) => request(`/messages/${id}`),
  
  // Envoyer un message (formulaire de contact)
  send: (messageData) => request('/messages', {
    method: 'POST',
    body: JSON.stringify(messageData),
  }),
  
  // Marquer comme lu
  markAsRead: (id) => request(`/messages/${id}/read`, {
    method: 'PATCH',
  }),
  
  // Archiver
  archive: (id) => request(`/messages/${id}/archive`, {
    method: 'PATCH',
  }),
  
  // Supprimer
  delete: (id) => request(`/messages/${id}`, {
    method: 'DELETE',
  }),
  
  // Supprimer tous les archivés
  deleteAllArchived: () => request('/messages/archived', {
    method: 'DELETE',
  }),
};

// ============================================
// SETTINGS API
// ============================================
export const settingsAPI = {
  // Récupérer tous les paramètres (admin)
  getAll: () => request('/settings'),
  
  // Récupérer les infos publiques du site
  getPublic: () => request('/settings/public'),
  
  // Récupérer un paramètre
  get: (key) => request(`/settings/${key}`),
  
  // Mettre à jour un paramètre
  update: (key, value) => request(`/settings/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ value }),
  }),
  
  // Mettre à jour plusieurs paramètres
  updateMultiple: (settings) => request('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  }),
};

// ============================================
// COMPTABILITE API
// ============================================
export const comptabiliteAPI = {
  // Récupérer les catégories
  getCategories: () => request('/comptabilite/categories'),
  
  // Récupérer les statistiques
  getStats: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/comptabilite/stats${queryString ? `?${queryString}` : ''}`);
  },
  
  // Récupérer toutes les transactions
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/comptabilite${queryString ? `?${queryString}` : ''}`);
  },
  
  // Récupérer une transaction
  getById: (id) => request(`/comptabilite/${id}`),
  
  // Créer une transaction
  create: (data) => request('/comptabilite', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Mettre à jour une transaction
  update: (id, data) => request(`/comptabilite/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  // Supprimer une transaction
  delete: (id) => request(`/comptabilite/${id}`, {
    method: 'DELETE',
  }),
};

// ============================================
// PROJETS API
// ============================================
export const projetsAPI = {
  // Récupérer les options (types, statuts)
  getOptions: () => request('/projets/options'),
  
  // Récupérer les statistiques
  getStats: () => request('/projets/stats'),
  
  // Récupérer tous les projets
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/projets${queryString ? `?${queryString}` : ''}`);
  },
  
  // Récupérer un projet
  getById: (id) => request(`/projets/${id}`),
  
  // Créer un projet
  create: (data) => request('/projets', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Mettre à jour un projet
  update: (id, data) => request(`/projets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  // Supprimer un projet
  delete: (id) => request(`/projets/${id}`, {
    method: 'DELETE',
  }),
};

// ============================================
// API PIÈCES JOINTES
// ============================================
export const attachmentsAPI = {
  // Récupérer les pièces jointes d'une entité
  getByEntity: (entityType, entityId) => request(`/attachments/${entityType}/${entityId}`),
  
  // Uploader un fichier
  upload: async (entityType, entityId, file) => {
    const token = localStorage.getItem('naatal_token');
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_URL}/attachments/${entityType}/${entityId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    return response.json();
  },
  
  // Supprimer un fichier
  delete: (id) => request(`/attachments/${id}`, { method: 'DELETE' }),
  
  // URL de téléchargement
  getDownloadUrl: (id) => `${API_URL}/attachments/download/${id}`,
};

// ============================================
// API CINÉMA
// ============================================
export const cinemaAPI = {
  // Récupérer tous les films (admin)
  getAll: () => request('/cinema'),
  
  // Récupérer les films publiés (public)
  getPublished: () => request('/cinema/public'),
  
  // Récupérer un film par ID
  getById: (id) => request(`/cinema/${id}`),
  
  // Créer un film
  create: (data) => request('/cinema', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Mettre à jour un film
  update: (id, data) => request(`/cinema/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  // Supprimer un film
  delete: (id) => request(`/cinema/${id}`, {
    method: 'DELETE',
  }),
};

// ============================================
// API BOUTIQUE
// ============================================
export const boutiqueAPI = {
  // Récupérer tous les produits (admin)
  getAll: () => request('/boutique'),
  
  // Récupérer les produits actifs (public)
  getActive: () => request('/boutique/public'),
  
  // Récupérer un produit par ID
  getById: (id) => request(`/boutique/${id}`),
  
  // Créer un produit
  create: (data) => request('/boutique', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Mettre à jour un produit
  update: (id, data) => request(`/boutique/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  // Supprimer un produit
  delete: (id) => request(`/boutique/${id}`, {
    method: 'DELETE',
  }),
};

// ============================================
// API STORYBOARD
// ============================================
export const storyboardAPI = {
  // Récupérer tous les boards
  getAll: (archived = false) => request(`/storyboard?archived=${archived}`),

  // Statistiques
  getStats: () => request('/storyboard/stats'),

  // Récupérer un board avec ses éléments
  getById: (id) => request(`/storyboard/${id}`),

  // Créer un nouveau board
  create: (data) => request('/storyboard', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Mettre à jour un board
  update: (id, data) => request(`/storyboard/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Dupliquer un board
  duplicate: (id) => request(`/storyboard/${id}/duplicate`, {
    method: 'POST',
  }),

  // Supprimer un board
  delete: (id) => request(`/storyboard/${id}`, {
    method: 'DELETE',
  }),

  // Sauvegarder les éléments d'un board
  saveElements: (id, data) => request(`/storyboard/${id}/elements`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// ============================================
// API UPLOADS (Images Covers)
// ============================================
export const uploadsAPI = {
  // Uploader une image de couverture
  uploadCover: async (file, type = 'cover') => {
    const token = localStorage.getItem('naatal_token');
    const formData = new FormData();
    formData.append('cover', file);
    formData.append('type', type);
    
    const response = await fetch(`${API_URL}/uploads/cover`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    return response.json();
  },
  
  // Supprimer une image de couverture
  deleteCover: (filename) => request(`/uploads/cover/${filename}`, { 
    method: 'DELETE' 
  }),
  
  // Obtenir l'URL complète d'une cover
  getCoverUrl: (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
    return `${baseUrl}${path}`;
  }
};

// ============================================
// HEALTH CHECK
// ============================================
export const checkAPIHealth = () => request('/health');

export default {
  auth: authAPI,
  users: usersAPI,
  medias: mediasAPI,
  messages: messagesAPI,
  settings: settingsAPI,
  comptabilite: comptabiliteAPI,
  projets: projetsAPI,
  attachments: attachmentsAPI,
  cinema: cinemaAPI,
  boutique: boutiqueAPI,
  storyboard: storyboardAPI,
  uploads: uploadsAPI,
  health: checkAPIHealth,
};
