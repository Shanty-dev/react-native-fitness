import {v2 as cloudinary} from "cloudinary";
 import "dotenv/config";

//  export const connectc = async () =>{
//    try {
//      const conn = await mongoose.connect(process.env.MONGO_URI)
//      console.log( `Database connected ${conn.connection.host}`);
 
//    } catch (error) {
//      console.log("error connecting to database", error);
//      process.exit(1); // exit with failuer
//    }
//  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  export default cloudinary;