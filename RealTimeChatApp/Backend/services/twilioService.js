const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const serviceSid = process.env.TWILIO_SERVICE_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);

const sendOtpToPhoneNumber = async(phoneNumber) => {
    try {
        console.log("sending otp to this number", phoneNumber);
        if(!phoneNumber) {
            throw new Error('phone number is required');
        }

        const response = await client.verify.v2.services(serviceSid).verifications.create({
            to: phoneNumber,
            channel: 'sms',
        });
        console.log('this is my otp response', response);
        return response;
    }
    catch(error) {
        console.error(error);
        console.log("Failed to send otp");
        throw new Error(`failed to send otp, ${error.message}`);
    }
}

const verifyOtp = async(phoneNumber, otp) => {
    try {
        console.log("sending otp to this number", phoneNumber);
        console.log("this is my otp", otp);
        if(!phoneNumber || !otp) {
            throw new Error('phone number and otp is required');
        }

        const response = await client.verify.v2.services(serviceSid).verificationChecks.create({
            to: phoneNumber,
            code: otp,
        });
        console.log('this is my otp verification response', response);
        return response;
    }
    catch(error) {
        console.error(error);
        console.log("otp verification failed");
        throw new Error(`failed to verify otp, ${error.message}`);
    }
}

module.exports = {
    sendOtpToPhoneNumber,
    verifyOtp,
}