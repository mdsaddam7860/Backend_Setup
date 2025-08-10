import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const deleteFileOnCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("File deleted successfully on cloudinary: ", result);
    return result;
  } catch (error) {
    throw new ApiError(500, "Error while deleting file on cloudinary");
  }
};

export { deleteFileOnCloudinary };
