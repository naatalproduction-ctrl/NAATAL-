// ============================================
// Routes des Messages
// ============================================
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  getAllMessages,
  getMessageById,
  createMessage,
  markAsRead,
  archiveMessage,
  deleteMessage,
  deleteAllArchived,
  getMessagesStats
} = require('../controllers/messagesController');

// Route publique (envoi de message depuis le site)
router.post('/', createMessage);

// Routes protégées (admin)
router.get('/', authMiddleware, getAllMessages);
router.get('/stats', authMiddleware, getMessagesStats);
router.get('/:id', authMiddleware, getMessageById);
router.patch('/:id/read', authMiddleware, markAsRead);
router.patch('/:id/archive', authMiddleware, archiveMessage);
router.delete('/archived', authMiddleware, deleteAllArchived);
router.delete('/:id', authMiddleware, deleteMessage);

module.exports = router;
