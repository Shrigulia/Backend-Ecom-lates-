import mongoose, { Types } from "mongoose";

const productSchema = mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    rating: {
        type: Number,
        default: 0
    },
    images: [
        {
            image: Buffer,
            mimType: String,
            extension: String
        }
    ],
    category: String,
    stock: {
        type: Number,
        default: 1
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    totalReview: {
        type: Number,
        default: 0
    },
    review: [
        {
            userId: {
                type: Types.ObjectId,
                ref: 'user'
            },
            name: String,
            comment: String,
            rating: Number
        }
    ],
});

export const productModel = mongoose.model('product', productSchema);