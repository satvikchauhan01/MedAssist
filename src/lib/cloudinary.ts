import {v2 as cloudinary} from 'cloudinary';

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})
// Buffer is a raw binary data object stored in memory 
// Buffer is fast an dmemory efficient , here file loaded in RAM temporarily 
export const uploadImage = async (buffer:Buffer)=>{
    return new Promise((resolve,reject)=>{
        cloudinary.uploader.upload_stream(
            {resource_type:"auto" , folder:"medicines"},
            (error,result)=>{
                if(error) reject(error);
                else resolve(result);
            }
        ).end(buffer);
    });
};

// cloudinary.uploader.upload_stream uses callbacks 
// we wrap it in a promise to use async/await syntax in our route handler