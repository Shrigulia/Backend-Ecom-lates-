import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    fullName: String,
    email: String,
    password: {
        type: String,
        select: false
    },
    cart: [
        {
            product: {
                type: mongoose.Types.ObjectId,
                ref: 'product'
            },
            qty: Number
        }
    ],
    orders: [],
    contact: String,
    address: {
        country: {
            type: String,
            default: 'Bharat'
        },
        state: String,
        area: String,
        houseNO: String,
        landmark: String
    },
    avatar: Buffer,
    isAdmin: {
        type: Boolean,
        default: false
    },
    verified: {
        type: Boolean,
        default: false
    },
    otp: Number,
    resetPasswordToken: String,
    resetPasswordTokenExpiry: Date,
    isPasswordTokenClicked: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const userModel = mongoose.model('user', userSchema);