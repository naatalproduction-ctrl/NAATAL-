// ============================================
// Routes Portfolio Soukavisuals
// ============================================
const express = require('express');
const router = express.Router();
const cors = require('cors');
const { authMiddleware } = require('../middleware/auth');
const {
  getProfile, updateProfile,
  getStats, getAllStats, createStat, updateStat, deleteStat,
  getProjects, getAllProjects, createProject, updateProject, deleteProject,
  getSkills, getAllSkills, createSkill, updateSkill, deleteSkill,
  getMarquee, getAllMarquee, createMarquee, updateMarquee, deleteMarquee,
  getMessages, createMessage, markMessageRead, deleteMessage,
  getPublicPortfolio,
} = require('../controllers/portfolioController');

// CORS ouvert pour les routes publiques du portfolio
const publicCors = cors({ origin: '*' });

// ============================================
// Routes publiques (frontend portfolio)
// ============================================
router.get('/public', publicCors, getPublicPortfolio);
router.get('/public/profile', publicCors, getProfile);
router.get('/public/stats', publicCors, getStats);
router.get('/public/projects', publicCors, getProjects);
router.get('/public/skills', publicCors, getSkills);
router.get('/public/marquee', publicCors, getMarquee);
router.post('/public/messages', publicCors, createMessage);

// ============================================
// Routes protégées (admin)
// ============================================

// Profil
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

// Stats
router.get('/stats', authMiddleware, getAllStats);
router.post('/stats', authMiddleware, createStat);
router.put('/stats/:id', authMiddleware, updateStat);
router.delete('/stats/:id', authMiddleware, deleteStat);

// Projects
router.get('/projects', authMiddleware, getAllProjects);
router.post('/projects', authMiddleware, createProject);
router.put('/projects/:id', authMiddleware, updateProject);
router.delete('/projects/:id', authMiddleware, deleteProject);

// Skills
router.get('/skills', authMiddleware, getAllSkills);
router.post('/skills', authMiddleware, createSkill);
router.put('/skills/:id', authMiddleware, updateSkill);
router.delete('/skills/:id', authMiddleware, deleteSkill);

// Marquee
router.get('/marquee', authMiddleware, getAllMarquee);
router.post('/marquee', authMiddleware, createMarquee);
router.put('/marquee/:id', authMiddleware, updateMarquee);
router.delete('/marquee/:id', authMiddleware, deleteMarquee);

// Messages
router.get('/messages', authMiddleware, getMessages);
router.put('/messages/:id/read', authMiddleware, markMessageRead);
router.delete('/messages/:id', authMiddleware, deleteMessage);

module.exports = router;
