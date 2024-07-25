import mongoose from "mongoose";
import { catchError, ioSocketFind, sendResponse } from "../utils/utils.js";
import { orderModel } from "../models/orderModel.js";
import { userModel } from "../models/userModel.js";

export const placeOrder = async (req, res) => {
    try {

        const cart = await userModel.findById(req.user._id).populate('cart.product');

        if (!cart.cart.length) return catchError(res, 400, false, 'cart is empty');

        const order = cart.cart.map(async e => {
            await orderModel.create({
                product: e.product._id,
                qty: e.qty,
                orderStatus: 'Processing',
                totalPrice: e.product.price * e.qty,
                orderBy: req.user._id
            })
        })

        cart.cart = [];

        await cart.save();

        ioSocketFind(req, 'order-placed', order);

        return sendResponse(res, 200, true, 'order placed and cart empty');

    } catch (error) {
        console.log(error);
        return catchError(res, 500, false, 'error in new order');
    }
}

export const myOrders = async (req, res) => {
    try {

        const myorders = await orderModel.find({ orderBy: req.user._id }).populate('product');

        if (!myorders.length) return catchError(res, 404, false, 'No orders yet');

        return sendResponse(res, 200, true, 'your orders fetched', { myorders, totalOrder: myorders.length });
    } catch (error) {
        console.log(error);

        return catchError(res, 500, false, 'error in myOrders');
    }
}

export const getOrderDetail = async (req, res) => {
    try {

        const { orderId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(orderId)) return catchError(res, 400, false, 'invalid order id');

        const order = await orderModel.findById(orderId).populate('product').populate('orderBy');

        if (!order) return catchError(res, 404, false, 'order not found');

        return sendResponse(res, 200, true, 'order Fetched', order)

    } catch (error) {
        console.log(error);

        return catchError(res, 500, false, 'error in getOrderDetail');
    }
}

export const allOrder = async (req, res) => {
    try {

        const orders = await orderModel.find();

        if (!orders.length) return catchError(res, 404, false, 'no orders yet');

        return sendResponse(res, 200, true, 'orders fetched', { orders, total: orders.length });

    } catch (error) {
        console.log(error);
        return catchError(res, 500, false, 'eror in all orders');
    }
}

export const deleteOrder = async (req, res) => {
    try {

        const { orderId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(orderId)) return catchError(res, 400, false, 'invalid order id');

        const order = await orderModel.findById(orderId);

        if (!order) return catchError(res, 404, false, 'order not found');

        await order.deleteOne();

        ioSocketFind(req, 'order-deleted', { orderId });

        return sendResponse(res, 200, true, 'order deleted')

    } catch (error) {
        console.log(error);
        return catchError(res, 500, false, 'error in deleteOrder');
    }
}

export const updateOrderStatus = async (req, res) => {
    try {

        const { orderId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(orderId)) return catchError(res, 400, false, 'invalid order id');

        const order = await orderModel.findById(orderId);

        if (!order) return catchError(res, 404, false, 'order not found');

        if (order.orderStatus === "Delievered") return catchError(res, 400, false, "You have already delievered this order");

        const { status } = req.body;

        if (!status) return catchError(res, 400, false, 'status required');

        if (order.orderStatus === 'Processing' && status === 'shipped') order.orderStatus = status;

        if (order.orderStatus === 'shipped' && status === 'Processing') return catchError(res, 400, false, 'order alredy shippid');

        if (order.orderStatus === 'shipped' && status === 'Delievered') order.orderStatus = status;

        await order.save();

        ioSocketFind(req, 'order-status-upated', order);

        return sendResponse(res, 200, true, `order status changed to ${status}`, order);

    } catch (error) {
        console.log(error);

        return catchError(res, 500, false, 'error in updateOrderStatus');
    }
}