import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const deleteFileOnCloudinary = async (fileUrl) => {
  // Extract public_id from URL
  const parts = fileUrl.split("/");

  // remove version part like "v1234567890"
  const cleanedParts = parts.filter(
    (part) => !(part.startsWith("v") && /^\d+$/.test(part.slice(1)))
  );

  const fileName = cleanedParts.pop(); // aniadpkm6ssmhu2fxcwt.jpg
  const folder = cleanedParts
    .slice(cleanedParts.indexOf("upload") + 1)
    .join("/");

  const publicId = (folder + "/" + fileName.split(".")[0]).replace(/^\/+/, "");

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    // console.log("File deleted successfully on cloudinary: ", result);
    return result;
  } catch (error) {
    throw new ApiError(500, "Error while deleting file on cloudinary");
  }
};

export { deleteFileOnCloudinary };
