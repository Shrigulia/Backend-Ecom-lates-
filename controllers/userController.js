import { userModel } from '../models/userModel.js';
import { catchError, generateOTP, ioSocketFind, sendMail, sendResponse, sendSMS, setCookie } from '../utils/utils.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { io } from '../app.js';

export const signUp = async (req, res) => {
    try {
        const { fullName, password, email } = req.body;

        const avatar = req.file ? req.file.buffer : null;

        let isUserExist = await userModel.findOne({ email });

        if (isUserExist) return catchError(res, 405, false, 'user already exist with this email');

        const hashedPassword = await bcrypt.hash(password, 10);

        const otp = generateOTP();

        const users = await userModel.find();

        const userCreated = await userModel.create({
            fullName,
            email,
            password: hashedPassword,
            otp
        });

        if (avatar) {
            userCreated.avatar = avatar
        }

        setTimeout(async () => {
            userCreated.otp = null;

            await userCreated.save();

        }, process.env.OTP_EXPIRY * 60 * 1000);

        const tempToken = jwt.sign({ id: userCreated._id }, process.env.JWT_SECRET, { expiresIn: process.env.OTP_EXPIRY * 60 });

        await res.cookie('tempToken', tempToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'development' ? false : true,
            sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
            // domain: process.env.DOMAIN,
            expires: new Date(Date.now() + process.env.OTP_EXPIRY * 60 * 1000)
        })

        await sendMail(res, email, 'OTP verification', "Ecom signup OTP", `Your otp for verification : - ${otp} \n will expire in ${process.env.OTP_EXPIRY} minute`);

        io.sockets.sockets.forEach((e) => {
            if (e.userId === '6694d1f00dd9433696b4a6a5') {
                e.emit('new-user-created', users);
            }
        })

        sendResponse(res, 200, true, `otp sent to mail \n will expire in ${process.env.OTP_EXPIRY} minute`)

    } catch (error) {

        sendResponse(res, 500, false, error.message)
        console.log(error);

    }
}

export const verifyOTP = async (req, res) => {
    try {

        const tempToken = await req.cookies.tempToken;

        if (!tempToken) return catchError(res, 404, false, 'temp token has expired , now resend otp');

        const decode = await jwt.verify(tempToken, process.env.JWT_SECRET);

        const user = await userModel.findById(decode.id);

        if (!user) return catchError(res, 404, false, 'User not found');

        const { otp } = req.body;

        if (!otp) return catchError(res, 500, false, 'OTP not entered');

        if (user.otp === null) return catchError(res, 500, false, 'otp has expired please resend');

        if (otp !== user.otp) return catchError(res, 401, false, 'wrong otp');

        if (otp === user.otp) {

            await res.cookie("tempToken", null, {
                expires: new Date(Date.now()),
            });

            await setCookie(res, user);

            user.otp = null;
            user.verified = true;

            await user.save();

            sendResponse(res, 200, true, 'Otp verified');
        };


    } catch (error) {

        console.log(error);
        sendResponse(res, 500, false, error.message);

    }
}

export const resendOTP = async (req, res) => {
    try {

        const { email } = req.body;

        if (!email) return catchError(res, 404, false, 'Fields are empty');

        const user = await userModel.findOne({ email });

        if (!user) return catchError(res, 404, false, 'USer not found with this email');

        if (user.otp != null) return catchError(res, 401, false, 'otp not expired yet');

        const otp = generateOTP();

        user.otp = otp;

        await user.save();

        setTimeout(async () => {
            user.otp = null;

            await user.save();

        }, process.env.OTP_EXPIRY * 60 * 1000);

        const tempToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.OTP_EXPIRY * 60 });

        await res.cookie('tempToken', tempToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'development' ? false : true,
            sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
            // domain: process.env.DOMAIN,
            expires: new Date(Date.now() + process.env.OTP_EXPIRY * 60 * 1000)
        })

        await sendMail(res, email, 'OTP resend', "Ecom resent OTP", `Your otp for verification : - ${otp} \n will expire in ${process.env.OTP_EXPIRY} minute`);

        sendResponse(res, 200, true, 'OTP resent success');

    } catch (error) {

        console.log(error);

        sendResponse(res, 500, false, 'error in resene otp');
    }
}

export const login = async (req, res) => {
    try {

        const { email, password } = req.body;

        const user = await userModel.findOne({ email }).select("+password");

        if (!user) return catchError(res, 404, false, 'User not found with email');

        if (!user.verified) return catchError(res, 401, false, 'Verify otp first');

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) return catchError(res, 401, false, 'WRong password');

        await setCookie(res, user);

        return sendResponse(res, 200, true, `Welcome ${user.fullName}`)

    } catch (error) {

        console.log(error);

        return sendResponse(res, 500, false, 'error in login')

    }
}

export const logout = async (req, res) => {
    try {

        await res.cookie('token', null, {
            expires: new Date(Date.now())
        });

        return sendResponse(res, 200, true, 'Logout success');

    } catch (error) {

        console.log(error);
        return sendResponse(res, 500, false, 'error in logout');
    }
}

export const deleteAccount = async (req, res) => {
    try {

        const user = await userModel.findById(req.user._id);

        if (!user) return catchError(res, 404, false, 'User not found');

        await user.deleteOne();

        await res.cookie('token', null, {
            expires: new Date(Date.now())
        });

        io.sockets.sockets.forEach((e) => {
            if (e.userId === '6694d1f00dd9433696b4a6a5') {
                e.emit('user-deleted', user);
            }
        })

        return sendResponse(res, 200, true, 'Account deleted successfuly');

    } catch (error) {

        console.log(error);
        return sendResponse(res, 500, false, 'error in deleteAccount');
    }
}

export const getMyProfile = async (req, res) => {

    try {

        const user = await userModel.findById(req.user._id);

        if (!user) return catchError(res, 404, false, 'user not found');

        return sendResponse(res, 200, true, 'Profile fetched successfuly', user);

    } catch (error) {
        console.log(error);
        return sendResponse(res, 500, false, 'error in getMyProfile');
    }
}

export const updatePassword = async (req, res) => {
    try {

        const user = await userModel.findById(req.user._id).select('+password');

        if (!user) return catchError(res, 404, true, 'user not found');

        const { oldPassword, newPassword, confirmPassword } = req.body;

        if (!oldPassword || !newPassword || !confirmPassword) return catchError(res, 401, false, 'all fields mut be filled');

        if (oldPassword === newPassword) return catchError(res, 401, false, 'new password must be different from old password');

        if (newPassword !== confirmPassword) return catchError(res, 401, false, 'new and confirm password must be same');

        const oldPAsswordCompare = await bcrypt.compare(oldPassword, user.password);

        if (!oldPAsswordCompare) return catchError(res, 401, false, 'Old password is wrong');

        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        user.password = newPasswordHash;

        await user.save();

        return sendResponse(res, 200, true, 'password updated successfuly');

    } catch (error) {

        console.log(error);
        return sendResponse(res, 500, false, 'error in updatePassword')

    }
}

export const updateProfile = async (req, res) => {
    try {

        const user = await userModel.findById(req.user._id);

        if (!user) return catchError(res, 404, false, 'user not found');

        const fieldToUpdate = ['fullName', 'email', 'contact', 'address.country', 'address.state', 'address.area', 'address.houseNO', 'address.landmark', 'avatar'];

        fieldToUpdate.forEach((e) => {
            const keys = e.split('.');

            const value = keys.reduce((obj, key) => (obj ? obj[key] : null), req.body);

            if (value !== undefined) {

                if (keys.length > 1) {
                    if (!user[keys[0]]) user[keys[0]] = {};
                    user[keys[0]][keys[1]] = value;

                } else {
                    user[keys[0]] = value;
                };
            };
        });

        if (req.file) {
            user.avatar = req.file.buffer;
        }

        await user.save();

        ioSocketFind(req, 'profile-upadted', user);

        return sendResponse(res, 200, true, 'Profile updated successfully');

    } catch (error) {
        console.log(error);
        return sendResponse(res, 500, false, 'error in updateProfile');
    }
}

export const forgotPassword = async (req, res) => {
    try {

        let user;

        if (req.cookies.token) {

            user = await userModel.findById(req.user._id);

        } else {

            if (!req.body.email) return catchError(res, 400, false, 'provide email as you are no logged in');

            user = await userModel.findOne({ email: req.body.email });

        }

        if (!user) return catchError(res, 404, false, 'User Not Found');

        if (user.isPasswordTokenClicked) {
            user.isPasswordTokenClicked = false;

            await user.save();
        }

        const token = crypto.randomBytes(20).toString('hex');

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const encryptedToken = await bcrypt.hash(hashedToken, 10);

        user.resetPasswordToken = encryptedToken;

        user.resetPasswordTokenExpiry = new Date(Date.now() + process.env.OTP_EXPIRY * 60 * 1000);

        await user.save();

        setTimeout(async () => {
            user.resetPasswordToken = null;

            user.resetPasswordTokenExpiry = null;

            await user.save();
        }, process.env.OTP_EXPIRY * 60 * 1000);

        const resetPasswordURL = `${req.protocol}://${req.get('host')}/api/v1/users/password/reset/${token}`;

        await sendMail(res, user.email, 'Password reset', 'Click on the link to reset password', `${resetPasswordURL} \n will expire in ${process.env.OTP_EXPIRY} minute automatically & once u open it`);

        return sendResponse(res, 200, true, 'Reset password link sent to your mail ');

    } catch (error) {

        console.log(error);

        return sendResponse(res, 500, false, 'error in forgot password');

    }
}

export const resetPasswordSendLink = async (req, res) => {

    try {

        const { token } = req.params;

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const users = await userModel.find({
            resetPasswordTokenExpiry: { $gt: Date.now() },
            isPasswordTokenClicked: false
        });

        let user, error;

        for (const e of users) {
            const validUser = await bcrypt.compare(tokenHash, e.resetPasswordToken);

            if (validUser) {
                user = e;
                break;
            }
        };

        if (!user) {

            error = 'Link has been expired';

            return res.render('index', { error });
        }

        if (user.resetPasswordToken === null || user.resetPasswordTokenExpiry === null || user.resetPasswordTokenExpiry < Date.now() || user.isPasswordTokenClicked) {

            error = 'Link has been expired';

            return res.render('index', { error });

        }

        user.isPasswordTokenClicked = true;

        await user.save();

        error = '';

        return res.render('index', { error });

    } catch (error) {
        console.log(error);

        return sendResponse(res, 500, false, 'error in resetPassword link send')

    }
}

export const resetPassword = async (req, res) => {

    try {

        const { token } = req.params;

        const { newPassword, confirmPassword } = req.body;

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        if (!token) return catchError(res, 404, false, 'Token has expired , token not present');

        const users = await userModel.find({
            resetPasswordTokenExpiry: { $gt: Date.now() },
            isPasswordTokenClicked: false
        }).select('+password');

        let user;

        for (const e of users) {
            let validUser = await bcrypt.compare(hashedToken, e.resetPasswordToken);

            if (validUser) {
                user = e;
                break;
            }
        }

        if (!user) return catchError(res, 404, false, 'Token has expired , resend it');

        if (user.resetPasswordToken === null || user.resetPasswordTokenExpiry === null || user.resetPasswordTokenExpiry < Date.now()) return catchError(res, 401, false, 'Token has been expired');

        if (!newPassword || !confirmPassword) return catchError(res, 400, false, 'field are empty');

        if (newPassword !== confirmPassword) return catchError(res, 400, false, 'new and confirm password must be same');

        let isOldPasswordSame = await bcrypt.compare(newPassword, user.password);

        if (isOldPasswordSame) return catchError(res, 400, false, 'New password must be different from old password');

        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        user.password = newPasswordHash;
        user.resetPasswordToken = null;
        user.resetPasswordTokenExpiry = null;

        await user.save();

        return sendResponse(res, 200, true, 'Password reseted successfuly');
    } catch (error) {

        console.log(error);

        return sendResponse(res, 500, false, 'error in resetPassword')
    }
}

// ------------------- ADMIN
export const getAllUsers = async (req, res) => {

    try {

        const { fullName, email, contact, isAdmin, verified, country, state, area, houseNO, landmark, page } = req.query;

        let query = {};
        if (fullName) {
            query.fullName = { $regex: fullName, $options: 'i' }
        }
        if (email) {
            query.email = { $regex: email, $options: 'i' }
        }
        if (contact) {
            query.contact = { $regex: contact, $options: 'i' }
        }
        if (isAdmin) {
            query.isAdmin = isAdmin === 'true';
        }
        if (verified) {
            query.verified = verified === 'true';
        }
        if (country) {
            query['address.country'] = { $regex: country, $options: 'i' }
        }
        if (state) {
            query['address.state'] = { $regex: state, $options: 'i' }
        }
        if (area) {
            query['address.area'] = { $regex: area, $options: 'i' }
        }
        if (houseNO) {
            query['address.houseNO'] = { $regex: houseNO, $options: 'i' }
        }
        if (landmark) {
            query['address.landmark'] = { $regex: landmark, $options: 'i' }
        }

        const resultPerPage = 10;
        const currentPage = Number(page) || 1
        const skip = resultPerPage * (currentPage - 1);
        const totalUsers = await userModel.countDocuments(query);
        const users = await userModel.find(query).skip(skip).limit(resultPerPage);

        return sendResponse(res, 200, true, 'all users fetched', { page: currentPage, usersFetched: users.length, totalUsers: totalUsers, users });

    } catch (error) {

        console.log(error);

        return sendResponse(res, 500, false, 'error in get all user');
    }
}

export const getSingleUserDetail = async (req, res) => {
    try {

        const { UserId } = req.params;

        if (!UserId || !mongoose.Types.ObjectId.isValid(UserId)) return catchError(res, 400, false, 'Invalid mongoose id');

        const user = await userModel.findById(UserId);

        if (!user) return catchError(res, 404, false, 'User not found');

        return sendResponse(res, 200, true, 'User fetched', user)

    } catch (error) {
        console.log(error);

        return catchError(res, 500, false, 'error in getSingleUserDetail');
    }
}

export const deleteSingleUser = async (req, res) => {
    try {

        const { UserId } = req.params;

        if (!UserId || !mongoose.Types.ObjectId.isValid(UserId)) return catchError(res, 400, false, 'Invalid mongoose id');

        const user = await userModel.findById(UserId);

        if (!user) return catchError(res, 404, false, 'User not found');

        await user.deleteOne();

        ioSocketFind(req, 'user-deleted-admin', user);

        return sendResponse(res, 200, true, 'User deleted')

    } catch (error) {
        console.log(error);

        return catchError(res, 500, false, 'error in deleteSingleUser');
    }
}

export const makeAdmin = async (req, res) => {
    try {

        const { UserId } = req.params;

        if (!UserId || !mongoose.Types.ObjectId.isValid(UserId)) return catchError(res, 400, false, 'Invalid mongoose id');

        const user = await userModel.findById(UserId);

        if (!user) return catchError(res, 404, false, 'User not found');

        user.isAdmin = !user.isAdmin;

        await user.save();

        ioSocketFind(req, 'role-update-admin', user);

        return sendResponse(res, 200, true, 'role updated', user);

    } catch (error) {
        console.log(error);

        return catchError(res, 500, false, 'error in makeAdmin');
    }
}
