import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    console.log("File Path couoldnt be found");
    // upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("File uploaded successfully on cloudinary: ", response.url);
    return response;
  } catch (error) {
    sf.unlinkSync(localFilePath);
    //remove the locally saved file as the
    // upload operation got failed
    console.log("Error while uploading file to cloudinary: ", error);
    return null;
  }
};

export { uploadOnCloudinary };
