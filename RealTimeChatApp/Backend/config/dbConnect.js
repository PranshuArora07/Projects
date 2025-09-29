const mongoose = require('mongoose');
require('dotenv').config();
// const {MONGODB_URL} = process.env;

exports.connectdb = async() => {
    try{
        await mongoose.connect(process.env.MONGODB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('db connection successful');
    }
    catch(err) {
        console.error("error connecting database", err.message);
        process.exit(1);
    }
}