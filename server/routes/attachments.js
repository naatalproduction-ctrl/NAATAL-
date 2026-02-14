// ============================================
// Routes des Pièces Jointes
// ============================================
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const {
  getAttachments,
  uploadAttachment,
  deleteAttachment,
  downloadAttachment
} = require('../controllers/attachmentsController');

// Configuration Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const entityType = req.params.entityType;
    const uploadPath = path.join(__dirname, '..', 'uploads', entityType + 's');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${req.params.entityType}-${req.params.entityId}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Types autorisés
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

// Routes
// IMPORTANT: Les routes spécifiques doivent être avant les routes avec paramètres
router.get('/download/:id', authenticateToken, downloadAttachment);
router.get('/:entityType/:entityId', authenticateToken, getAttachments);
router.post('/:entityType/:entityId', authenticateToken, upload.single('file'), uploadAttachment);
router.delete('/:id', authenticateToken, deleteAttachment);

module.exports = router;
