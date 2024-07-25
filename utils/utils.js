import { Vonage } from "@vonage/server-sdk";
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { io } from "../app.js";

export const catchError = (res, status, success, message) => {
    res.status(status).json({
        success: success,
        message: message
    })
};

export const generateOTP = () => {
    // Generate a random 4-digit number between 1000 and 9999
    const otp = Math.floor(1000 + Math.random() * 9000);
    return otp.toString();
}

const vonage = new Vonage({
    apiKey: process.env.VONAGE_KEY,
    apiSecret: process.env.VONAGE_SECRET,
})

export const sendSMS = async (number, sender, msg) => {
    await vonage.sms.send({ number, sender, msg })
        .then(resp => { console.log('Message sent successfully'); console.log(resp); })
        .catch(err => console.log(err));
}

export const sendResponse = (res, status, success, messasge, result) => {
    res.status(status).json({
        success: success,
        message: messasge,
        result
    })
}

export const sendMail = async (res, email, subject, heading, message) => {
    try {


        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            service: "gmail",
            secure: false, // Use `true` for port 465, `false` for all other ports
            auth: {
                user: "narutoaddicts574@gmail.com",
                pass: "niriirmvpalxkaku",
            },
        });

        const info = await transporter.sendMail({
            from: "narutoaddicts574@gmail.com",
            to: email,
            subject: subject,
            text: heading,
            html: `<h1>${message}</h1>`,
        });

    } catch (error) {

        console.log(error.message);

        return res.status(500).json({
            success: false,
            message: 'some error in sendmail'
        });

    }
}

export const setCookie = async (res, user) => {

    try {

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        await res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'development' ? false : true,
            sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
            // domain: process.env.DOMAIN,
            expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000)
        });

    } catch (error) {

        console.log(error.message);

        return sendResponse(res, 500, false, 'Some error in setCookie');

    }
}

export const ioSocketFind = (req, sokcetName, data) => {
    io.sockets.sockets.forEach((e) => {
        if (e.userId === req.user._id.toString()) {
            e.emit(sokcetName, { data })
        }
    })
}
