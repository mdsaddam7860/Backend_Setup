import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get data from frontend
  // check validation - not empty
  // check if user is already registered :- email,username
  // check for images , check for avatar
  // upload them to cloudinary , avatar
  // create user object - create user entry in db
  // remove password and refresh token fields from response
  // check for user creation
  // return response
  // How to get user details from frontend we can use req.body for that purpose
  // except url
  // Destructuring the request body to extract user details
  const { userName, fullName, email, password } = req.body; // we can extract info from request body
  console.log("email", email);

  // Validation check
  if (
    [fullName, userName, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Check for user if already exist
  const existedUser = User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    throw new ApiError((409, "usename or email already exist"));
  }

  // multer gives req.file

  const avatarLocalFilePath = req.files?.avatar[0].path;
  // console.log("localFilePath", avatarLocalFilePath);
  const coverImaageLocalFilePath = req.files?.coverImage[0].path;
  // console.log("coverImaageLocalFilePath", coverImaageLocalFilePath);

  if (!avatarLocalFilePath) {
    throw new ApiError(400, "Avatar is required");
  }

  // upload on cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalFilePath);
  const coverImage = uploadOnCloudinary(coverImaageLocalFilePath);

  // avartar is required
  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }

  // Create user
  const user = await User.create({
    userName,
    fullName,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfuully"));
});

export { registerUser };
