// ============================================
// Routes Storyboard
// ============================================
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getAllBoards,
  getBoardById,
  createBoard,
  updateBoard,
  duplicateBoard,
  deleteBoard,
  getBoardStats,
  saveElements,
} = require('../controllers/storyboardController');

// All storyboard routes require authentication
router.get('/', authenticateToken, getAllBoards);
router.get('/stats', authenticateToken, getBoardStats);
router.get('/:id', authenticateToken, getBoardById);
router.post('/', authenticateToken, createBoard);
router.put('/:id', authenticateToken, updateBoard);
router.post('/:id/duplicate', authenticateToken, duplicateBoard);
router.delete('/:id', authenticateToken, deleteBoard);
router.put('/:id/elements', authenticateToken, saveElements);

module.exports = router;
