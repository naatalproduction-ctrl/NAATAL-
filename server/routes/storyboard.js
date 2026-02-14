// ============================================
// Routes Storyboard
// ============================================
const express = require('express');
const router = express.Router();
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

// Routes publiques (pas d'auth requise pour le storyboard)
router.get('/', getAllBoards);
router.get('/stats', getBoardStats);
router.get('/:id', getBoardById);
router.post('/', createBoard);
router.put('/:id', updateBoard);
router.post('/:id/duplicate', duplicateBoard);
router.delete('/:id', deleteBoard);

// Sauvegarde des éléments d'un board
router.put('/:id/elements', saveElements);

module.exports = router;
