// ============================================
// Context Global du Site NAATAL
// ============================================
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mediasAPI, messagesAPI, settingsAPI, authAPI } from '../services/api';

const SiteContext = createContext(null);

export function SiteProvider({ children }) {
  // État global
  const [medias, setMedias] = useState([]);
  const [categories, setCategories] = useState([]);
  const [messages, setMessages] = useState([]);
  const [siteInfo, setSiteInfo] = useState({});
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================
  // Authentification
  // ============================================
  const login = async (username, password) => {
    try {
      const response = await authAPI.login(username, password);
      if (response.success) {
        setAdmin(response.data.user);
        return { success: true };
      }
      return { success: false, error: response.error || 'Identifiants incorrects' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    authAPI.logout();
    setAdmin(null);
  };

  const checkAuth = useCallback(async () => {
    if (authAPI.isAuthenticated()) {
      try {
        const response = await authAPI.verify();
        if (response.success) {
          setAdmin(response.data);
        }
      } catch {
        authAPI.logout();
        setAdmin(null);
      }
    }
  }, []);

  // ============================================
  // Médias
  // ============================================
  const fetchMedias = useCallback(async () => {
    try {
      const response = await mediasAPI.getGrouped();
      if (response.success) {
        setCategories(response.data);
        // Extraire tous les médias dans une liste plate
        const allMedias = response.data.flatMap(cat => cat.medias || []);
        setMedias(allMedias);
      }
    } catch (err) {
      console.error('Erreur chargement médias:', err);
    }
  }, []);

  const addMedia = async (mediaData) => {
    try {
      const response = await mediasAPI.create(mediaData);
      if (response.success) {
        await fetchMedias();
        return { success: true, data: response.data };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateMedia = async (id, mediaData) => {
    try {
      const response = await mediasAPI.update(id, mediaData);
      if (response.success) {
        await fetchMedias();
        return { success: true };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteMedia = async (id) => {
    try {
      const response = await mediasAPI.delete(id);
      if (response.success) {
        await fetchMedias();
        return { success: true };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const getMediasByCategory = (categorySlug) => {
    const category = categories.find(c => c.slug === categorySlug);
    return category?.medias || [];
  };

  // ============================================
  // Messages
  // ============================================
  const fetchMessages = useCallback(async () => {
    if (!admin) return;
    try {
      const response = await messagesAPI.getAll();
      if (response.success) {
        setMessages(response.data);
      }
    } catch (err) {
      console.error('Erreur chargement messages:', err);
    }
  }, [admin]);

  const sendMessage = async (messageData) => {
    try {
      const response = await messagesAPI.send(messageData);
      return response;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const markMessageAsRead = async (id) => {
    try {
      await messagesAPI.markAsRead(id);
      await fetchMessages();
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const deleteMessage = async (id) => {
    try {
      await messagesAPI.delete(id);
      await fetchMessages();
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  // ============================================
  // Paramètres du site
  // ============================================
  const fetchSiteInfo = useCallback(async () => {
    try {
      const response = await settingsAPI.getPublic();
      if (response.success) {
        setSiteInfo(response.data);
      }
    } catch (err) {
      console.error('Erreur chargement infos site:', err);
    }
  }, []);

  const updateSettings = async (settings) => {
    try {
      const response = await settingsAPI.updateMultiple(settings);
      if (response.success) {
        await fetchSiteInfo();
        return { success: true };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ============================================
  // Initialisation
  // ============================================
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchMedias(),
          fetchSiteInfo(),
          checkAuth()
        ]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchMedias, fetchSiteInfo, checkAuth]);

  // Recharger les messages quand l'admin se connecte
  useEffect(() => {
    if (admin) {
      fetchMessages();
    }
  }, [admin, fetchMessages]);

  // ============================================
  // Valeur du Context
  // ============================================
  const value = {
    // État
    medias,
    categories,
    messages,
    siteInfo,
    admin,
    loading,
    error,
    
    // Auth
    login,
    logout,
    isAuthenticated: !!admin,
    
    // Médias
    fetchMedias,
    addMedia,
    updateMedia,
    deleteMedia,
    getMediasByCategory,
    
    // Messages
    fetchMessages,
    sendMessage,
    markMessageAsRead,
    deleteMessage,
    unreadCount: messages.filter(m => !m.is_read).length,
    
    // Settings
    fetchSiteInfo,
    updateSettings,
  };

  return (
    <SiteContext.Provider value={value}>
      {children}
    </SiteContext.Provider>
  );
}

// Hook personnalisé pour utiliser le context
export function useSite() {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSite doit être utilisé dans un SiteProvider');
  }
  return context;
}

export default SiteContext;
