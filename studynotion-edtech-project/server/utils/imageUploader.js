const cloudinary = require("cloudinary").v2

exports.uploadImageToCloudinary = async (file, folder, height, quality) => {
  const options = { folder }
  if (height) {
    options.height = height
  }
  if (quality) {
    options.quality = quality //1 to 100 or "auto " or "best"
  }
  options.resource_type = "auto" //if not image then error nhi dega 
  console.log("OPTIONS", options)
  return await cloudinary.uploader.upload(file.tempFilePath, options)
}
//can also include  fetch_format: "auto",   -> save in webP smaller than jpg
