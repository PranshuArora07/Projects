const cloudinary = require("cloudinary").v2;
const multer = require('multer');
const fs = require('fs');
const dotenv = require('dotenv');

const cloudinaryConnect = () => {
    try {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        })
    }
    catch(err) {
        console.log('error connecting to cloudinary');
    }
}

const uploadFileToCloudinary = (file) => {
    const options = {
        resource_type: file.mimetype.startsWith('video') ? 'video':'image',
    }

    return new Promise((resolve, reject) => {
        const uploader = file.mimetype.startsWith('video') ? cloudinary.uploader.upload_large : cloudinary.uploader.upload;
        uploader(file.path, options, (error, result) => {
            fs.unlink(file.path, () => {});
            if(error) {
                return reject(error);
            }
            resolve(result);
        })
    })
};

const multerMiddleware = multer({dest: 'upload/'}).single('media');

module.exports = {
    cloudinaryConnect,
    uploadFileToCloudinary,
    multerMiddleware
}