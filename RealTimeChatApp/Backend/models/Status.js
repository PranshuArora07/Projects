const mongoose = require('mongoose');


const statusSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true,
    },
    contentType: {
        type: String,
        enum: ['image', 'video','text'],
        dafault: 'text'
    },
    viewers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }],
    expiresAt: {
        type: Date,
        required: true
    }
}, {timestamps: true})


module.exports = mongoose.model("Status", statusSchema)