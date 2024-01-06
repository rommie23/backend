import fs from 'fs'

import {v2 as cloudinary} from 'cloudinary';

// Cloudinary upload cofiguration
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_SECRET_KEY
});

// uploading file to cloudinary

const uploadOnCloudinary = async(localFilePath)=>{
    try {
        if (!localFilePath) return null;
        // else upload file
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type : "auto"
        })
        // file has been uploaded successfully
        // console.log('file uploaded successfully', response.url)
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)    // remove locally saved temp files as upload operation got failed
        return null
    }
}

const deleteCloudinary= async(publicId)=>{
    if (!publicId) return null;
    const response = await cloudinary.delete_resources([publicId], 
        { type: 'upload', resource_type: 'image' })
}
export {uploadOnCloudinary, deleteCloudinary}

/////////// copied from cloudinary /////////////////
// cloudinary.v2.api
//   .delete_resources(['nbbzw7jvjxibnodfqyf8'], 
//     { type: 'upload', resource_type: 'image' })
//   .then(console.log);