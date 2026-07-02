const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    generateDescription,
    generateDetailsFromImage,
    semanticSearch
} = require('../controllers/productController');
const authenticate = require("../middleware/authenticate");
const authorizeRoles = require("../middleware/authorization");

router.get('/search/semantic', semanticSearch);

router.route('/')
    .get(getProducts)
    .post(authenticate, authorizeRoles('admin'), createProduct);

router.route('/:id')
    .get(getProductById)
    .put(authenticate, authorizeRoles('admin'), updateProduct)
    .delete(authenticate, authorizeRoles('admin'), deleteProduct);

router.post("/generate-description", authenticate, authorizeRoles("admin"), generateDescription);

// --- Middleware Configuration ---
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.route('/generate-details-from-image')
    .post(authenticate, authorizeRoles('admin'), upload.single('image'), generateDetailsFromImage);

module.exports = router;
