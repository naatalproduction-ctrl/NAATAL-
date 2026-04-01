// ============================================
// Routes des Tâches
// ============================================
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getStats
} = require('../controllers/tasksController');

// Toutes les routes sont protégées
router.use(authMiddleware);

// Routes
router.get('/stats', getStats);
router.get('/', getAllTasks);
router.get('/:id', getTaskById);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
