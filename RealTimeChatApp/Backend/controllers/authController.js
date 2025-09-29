const User = require("../models/User");
const otpGenerate = require("../utils/otpGenerator");
const response = require("../utils/responseHandler");
const sendOtpToEmail = require("../services/emailService");
const twilioService = require("../services/twilioService");
const generateToken= require("../utils/generateToken");
const {uploadFileToCloudinary} = require("../config/cloudinaryConfig");
const Conversation = require('../models/Conversation');


const sendOtp = async(req, res) => {
    try{
        const {phoneNumber, phoneSuffix, email} = req.body;
        const otp = otpGenerate();
        const expiry = new Date(Date.now() + 5*60*1000); //5min
        let user;

    
        //email came 
        if(email) {
            
            user = await User.findOne({email});
            if(!user) {
                user = new User({email});
            }
            
            user.emailOtp = otp;
            user.emailOtpExpire = expiry;
            await user.save();
            
            await sendOtpToEmail(email, otp);
        
            return response(res, 200, 'otp send to email', {email});
            // return res.status(200).json({
            //     success: true,
            //     message: "otp email send successfully",
            //     email:email,
            // });
        }
        else {
            //neither email nor phonenumber nor phonesuffix come
            console.log("req.body received:", req.body);

            if(!phoneNumber || !phoneSuffix) {
                return response(res, 400, 'phone number and phone suffix are required');
            }

            //only phonenumber and phone suffix come
            const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`;
            user = await User.findOne({phoneNumber});
            if(!user) {
                user = new User({phoneNumber, phoneSuffix});
            }
            await user.save();
            await twilioService.sendOtpToPhoneNumber(fullPhoneNumber)

            return response(res, 200, 'otp send successfully to phone number', user);

            }
        
    }
    catch(error) {
        console.error("Error while sending otp");
        return response(res, 500, `Error while sending otp, ${error.message}`);
    }

}

//verify the send otp
const verifyOtp = async(req, res) => {
    try {
        const {phoneNumber, phoneSuffix, email, otp}= req.body;
        let user;
        if(email) {
            user = await User.findOne({email});
            if(!user) {
                return response(res, 404, 'User not found');
            }

            const now = new Date();
            if(!user.emailOtp || String(user.emailOtp) != String(otp) || now > new Date(user.emailOtpExpire)) {
                return response(res, 400, 'Invalid or expired otp');
            }

            user.isVerified = true;
            user.emailOtp = null;
            user.emailOtpExpire = null;
            await user.save();

        }
        else {
            if(!phoneNumber || !phoneSuffix) {
                return response(res, 400,'phone number and phone suffix are required');
            }
            const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`;
            user = await User.findOne({phoneNumber});

            if(!user) {
                return response(res, 404, 'User not found');
            }

            const result = await twilioService.verifyOtp(fullPhoneNumber, otp);
            if(result.status !== 'approved') {
                return response(res, 400, 'Invalid otp');
            }
            user.isVerified = true;
            await user.save();
        }

        const token = generateToken(user?._id);
        res.cookie("auth_token", token, {
            httpOnly: true,
            maxAge: 365 * 24 * 60 * 60 * 1000,
        });
        return response(res, 200, 'otp verified successfully', {token, user});

    }
    catch(error) {
        console.error(error);
        console.log("error in otp verification");
        return response(res, 500, 'Internal server error');
    }
}

const updateProfile = async(req, res) => {
    try {
        const {username, agreed, about} = req.body;
        const userId = req.user.userId;

        const user = await User.findById(userId);
        const file = req.file
        if(file) {
            const uploadResult = await uploadFileToCloudinary(file);
            console.log('cloudinary upload result',uploadResult);
            user.profilePicture = uploadResult?.secure_url;
        }
        else if(req.body.profilePicture) {
            user.profilePicture = req.body.profilePicture;
        }
        if(username) user.username = username;
        if(agreed)  user.agreed = agreed;
        if(about) user.about = about;
        await user.save();

        return response(res, 200, 'user profile updated successfully', user);
    }
    catch(err) {
        console.error(err);
        console.log('error while updating profile');
        return response(res, 500, 'Internal server error');
    }
}

//if logged in successfully thne check if user information is presnt or not
const checkAuthenticated = async(req, res) => {
    try {
        const userId = req.user.userId;
        if(!userId) {
            return response(res, 404, "unauthorized ! please login before accessing our app");
        }
        const user = await User.findById(userId);
        if(!user) {
            return response(res, 404, 'user not found');
        }

        return response(res, 200, 'user retrived and allow to use ChatApp', user);
    }
    catch(err) {
        console.error(err);
        return response(res, 500, 'Internal server error');
    }
}

const getAllUsers = async(req, res)=> {
    const loggedInUser = req.user.userId;
    try{
        const users = await User.find({_id:{$ne : loggedInUser}}).select(
            "username profilePicture lastSeen isOnline about phoneNumber phoneSuffix"
        ).lean();

        const userWithConversation = await Promise.all(
            users.map(async(user) => {
                const conversation = await Conversation.findOne({
                    participants: {$all: [loggedInUser, user?._id]}
                }).populate({
                    path:"lastMessage",
                    select:'content createdAt sender receiver',
                }).lean();

                return {
                    ...user,
                    conversation: conversation || null,
                }
            })
        );

        return response(res, 200, 'users retrived successfully', userWithConversation);
    }
    catch(err) {
        console.error(err);
        console.log('error fetching all the users');
        return response(res, 500, 'Internal Server Error');
    }
}

const logout = (req, res)=> {
    try{
        res.cookie('auth_token',"",{expires: new Date(0)});
        return response(res, 200, 'user logout successfully');
    }
    catch(err) {
        console.error(err);
        return response(res, 500, 'internal server error');
    }
    
    
}

module.exports = {
    sendOtp,
    verifyOtp,
    updateProfile,
    logout,
    checkAuthenticated,
    getAllUsers
}