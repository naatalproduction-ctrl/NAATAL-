// ============================================
// Routes pour Upload d'images (Covers)
// ============================================
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');

// Configuration Multer pour les covers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'covers');
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const type = req.body.type || 'cover'; // cinema ou boutique
    cb(null, `${type}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Types d'images autorisés
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Seules les images sont acceptées (JPEG, PNG, GIF, WEBP)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max pour les images
  }
});

// Route d'upload d'image cover
router.post('/cover', authenticateToken, upload.single('cover'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Aucun fichier uploadé' 
      });
    }

    // Construire l'URL de l'image
    const imageUrl = `/uploads/covers/${req.file.filename}`;
    
    res.json({ 
      success: true, 
      data: {
        url: imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      message: 'Image uploadée avec succès'
    });
  } catch (error) {
    console.error('Erreur upload cover:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erreur lors de l\'upload' 
    });
  }
});

// Route pour supprimer une image cover
router.delete('/cover/:filename', authenticateToken, (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '..', 'uploads', 'covers', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'Image supprimée' });
    } else {
      res.status(404).json({ success: false, error: 'Fichier non trouvé' });
    }
  } catch (error) {
    console.error('Erreur suppression cover:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Middleware de gestion d'erreur multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        error: 'Le fichier est trop volumineux. Taille max: 5MB' 
      });
    }
    return res.status(400).json({ success: false, error: error.message });
  }
  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  next();
});

module.exports = router;
