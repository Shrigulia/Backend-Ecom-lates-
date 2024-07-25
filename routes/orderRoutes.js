import express from 'express';
import { adminRole, isLoggedIn } from '../middlewares/authentication.js'
import { allOrder, deleteOrder, getOrderDetail, myOrders, placeOrder, updateOrderStatus } from '../controllers/orderController.js';

const router = express.Router();

// new order
router.post('/place', isLoggedIn, placeOrder);

// my order
router.get('/my', isLoggedIn, myOrders);

// order detail
router.get('/:orderId', isLoggedIn, getOrderDetail);

// all orders
router.get('/get/all', isLoggedIn, adminRole, allOrder);

// delete order
router.delete('/delete/:orderId', isLoggedIn, adminRole, deleteOrder);

// update odrer status
router.post('/status/update/:orderId', isLoggedIn, adminRole, updateOrderStatus);

export default router;