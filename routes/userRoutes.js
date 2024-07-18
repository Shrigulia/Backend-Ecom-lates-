import express from 'express'
import upload from '../config/multerConfig.js';
import { login, resendOTP, signUp, verifyOTP, logout, deleteAccount, getMyProfile, updatePassword, updateProfile, forgotPassword, resetPasswordSendLink, resetPassword, getAllUsers, getSingleUserDetail, deleteSingleUser, makeAdmin } from '../controllers/userController.js';
import { adminRole, isLoggedIn, optionalAuthenticated } from '../middlewares/authentication.js';

const router = express.Router();

// sign up
router.post('/signup', upload.single('avatar'), signUp);

// verify otp
router.post('/otp/verify', verifyOTP);

// resend otp
router.post('/otp/resend', resendOTP);

// login
router.post('/login', login);

// logout
router.get('/logout', isLoggedIn, logout);

// delete account
router.delete('/delete', isLoggedIn, deleteAccount);

// my profile
router.get('/me', isLoggedIn, getMyProfile);

// update password
router.put('/password/update', isLoggedIn, updatePassword);

// update profile
router.put('/profile/update', isLoggedIn, upload.single('avatar'), updateProfile);

// forgot password
router.post('/password/forgot', optionalAuthenticated, forgotPassword);

// reset password link send
router.get('/password/reset/:token', resetPasswordSendLink);

// reset password
router.post('/password/reset/:token', resetPassword);

// ------ admin routes
router.get('/all/admin', isLoggedIn, adminRole, getAllUsers);

// get, delete, update single user
router
    .get('/:UserId', isLoggedIn, adminRole, getSingleUserDetail)
    .delete('/:UserId', isLoggedIn, adminRole, deleteSingleUser)
    .put('/:UserId', isLoggedIn, adminRole, makeAdmin);



export default router;