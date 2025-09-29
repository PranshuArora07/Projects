const mongoose =  require("mongoose");


const userSchema = new mongoose.Schema({
    phoneNumber : {
        type: String,
        unique: true,
        sparse: true
    },
    //+91
    phoneSuffix : {
        type: String,
        unique: false,
    },
    username: {
        type: String, 
    },
    email: {
        type: String,
        lowercase: true,
        validate: {
            validator: function(v) {
                // You can use a more robust regex or an external library here
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); 
            },
            message: props => `${props.value} is not a valid email address!`
        }
    },
    emailOtp: {
        type: String,
    },
    emailOtpExpire: {
        type: Date,
    },
    profilePicture: {
        type: String,
    },
    about: {
        type: String,
    },
    lastSeen: {
        type: Date,
    },
    isOnline: {
        type: Boolean,
        default: false,
    },
    //when otp is verified
    isVerified: {
        type: Boolean,
        default: false,
    },
    //agreed that logging in with phone or email
    agreed: {
        type: Boolean,
        default: false,
    }

}, {timestamps: true});

module.exports = mongoose.model("User", userSchema);