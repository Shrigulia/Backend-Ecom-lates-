import mongoose from "mongoose";

const orderSchema = mongoose.Schema({
    product: {
        type: mongoose.Types.ObjectId,
        ref: 'product'
    },
    qty: {
        type: Number,
        default: 1
    },
    orderStatus: {
        type: String,
        required: true,
        default: "Processing"
    },
    deliveredAt: Date,
    totalPrice: Number,
    orderBy: {
        type: mongoose.Types.ObjectId,
        ref: 'user'
    },
    // totalOrderPrice: Number,
    orderAt: {
        type: Date,
        default: Date.now
    }
});


export const orderModel = mongoose.model('order', orderSchema);
