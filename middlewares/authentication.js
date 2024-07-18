import jwt from 'jsonwebtoken';
import { catchError, sendResponse } from '../utils/utils.js';
import { userModel } from '../models/userModel.js';

export const isLoggedIn = async (req, res, next) => {

    try {

        const { token } = req.cookies;

        if (!token) return catchError(res, 401, false, 'Login required to access the route');

        const decode = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decode.id);

        req.user = user;

        next();

    } catch (error) {
        console.log(error);
        sendResponse(res, 500, false, 'error in isLoggedIn');
    }

}

export const optionalAuthenticated = async (req, res, next) => {

    try {

        const { token } = req.cookies;

        if (!token) return next();


        const decode = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decode.id);

        if (!user) return catchError(res, 404, false, 'User not found');

        req.user = user;

        next();

    } catch (error) {
        console.log(error);
        sendResponse(res, 500, false, 'error in optionalAuthenticated');
    }

}

export const adminRole = async (req, res, next) => {
    try {

        if (!req.user.isAdmin) return catchError(res, 401, false, 'Only admin can acess this route');

        next();

    } catch (error) {
        console.log(error);
        return sendResponse(res, 500, false, 'error in adminRole');
    }
}
