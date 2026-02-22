const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  getAllMenu,
  getMenuBySection,
  getMenuByCategory,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  bulkDeleteMenuItems,
  bulkToggleAvailability,
  migrateMenuItems
} = require('../controllers/menuController');
const { protect, admin } = require('../middleware/auth');

// Multer config for menu images
const uploadDir = path.join(__dirname, '..', 'uploads', 'menu');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `menu-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) return cb(null, true);
  cb(new Error('Only image files (jpg, png, gif, webp) are allowed'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } });

// Multer error handler wrapper
const handleUpload = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Image too large. Maximum size is 20 MB.' });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// Public routes
router.get('/', getAllMenu);
router.get('/section/:section', getMenuBySection);
router.get('/category/:category', getMenuByCategory);
router.get('/:id', getMenuItem);

// Admin only routes (with optional image upload)
router.post('/migrate', protect, admin, migrateMenuItems);
router.post('/bulk-delete', protect, admin, bulkDeleteMenuItems);
router.put('/bulk-availability', protect, admin, bulkToggleAvailability);
router.post('/', protect, admin, handleUpload, createMenuItem);
router.put('/:id', protect, admin, handleUpload, updateMenuItem);
router.delete('/:id', protect, admin, deleteMenuItem);

module.exports = router;
