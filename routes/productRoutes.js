import express from 'express';
import { adminRole, isLoggedIn } from '../middlewares/authentication.js';
import { productUpload } from '../config/multerConfig.js';
import { addProductImage, addToCart, allReviewOfProduct, createProduct, createReview, deleteProduct, deleteProductImage, deleteReview, getAllProducts, getProductDetail, updateProduct } from '../controllers/productController.js';

const router = express.Router();

// get all products
router.get('/', getAllProducts)

// product create
router.post('/create', isLoggedIn, adminRole, productUpload.array('images', 5), createProduct);

// update product
router.put('/update/:productId', isLoggedIn, adminRole, updateProduct);

// deleet any image of product
router.delete('/delete/:productId/image/:imageId', isLoggedIn, adminRole, deleteProductImage);

// add img to product
router.post('/addimg/:productId', isLoggedIn, adminRole, productUpload.array('images', 5), addProductImage);

// single product detail ,delete product 
router.get('/:productId', getProductDetail);

// delete product
router.delete('/delete/:productId', isLoggedIn, adminRole, deleteProduct);

// create review
router.post('/create/review/:productId', isLoggedIn, createReview);

// all review of product
router.get('/review/:productId', allReviewOfProduct);

// delete review
router.delete('/delete/:productId/review/:reviewId', isLoggedIn, adminRole, deleteReview);

// add to cart single product
router.post('/cart/:productId', isLoggedIn,addToCart)

export default router;