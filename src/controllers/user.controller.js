import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    // Store the refreshToken in the user document
    user.refreshToken = refreshToken;
    // Save the user document without validating fields
    user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log("Error generating access and refresh token: ", error);
    throw new ApiError(500, "Internal Server Error");
  }
};

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
  // -----------------------------------------------------
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
  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    console.log("existedUser", existedUser);
    throw new ApiError((409, "usename or email already exist"));
  }

  // multer gives req.file

  const avatarLocalFilePath = req.files?.avatar[0].path;
  // console.log("localFilePath", avatarLocalFilePath);
  // const coverImageLocalFilePath = req.files?.coverImage[0].path;
  // console.log("coverImageLocalFilePath", coverImageLocalFilePath);

  let coverImageLocalFilePath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalFilePath = req.files.coverImage[0].path;
  }

  if (!avatarLocalFilePath) {
    throw new ApiError(400, "Avatar is required");
  }

  // upload on cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalFilePath);
  const coverImage = await uploadOnCloudinary(coverImageLocalFilePath);

  // avatar is required
  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }

  // Create user
  const user = await User.create({
    fullName,
    userName: userName.toLowerCase(),
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  console.log("Created user successfully: ");

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // Implement login functionality
  // take input from user
  // validate it
  // I also need to check for  cookies
  // check if user exists
  // check for pasword match
  // should i return access token or refresh token
  // send cookies
  // use ApiResponse class to return response
  // -------------------------------------------------------
  // Destructuring the request body to extract user details
  // console.log("req.body", req.body);
  const { userName, email, password } = req.body;
  // console.log("email", email);
  // console.log("password", password);

  // validate user

  if (!(userName || email)) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }
  const isPasswordValidate = await user.isPasswordCorrect(password);

  if (!isPasswordValidate) {
    throw new ApiError(401, "Invalid credentials");
  }
  console.log("generate access token");
  // generate refresh ans access Token
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // Options for cookies with this frontend cant modify cookies
  const options = {
    httpOnly: true,
    secure: true,
  };

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  console.log("req.user._id", req.user._id);
  console.log("req.user", req.user);
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined, // Clear the refresh token
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = await jwt(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return req
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, "Invalid Refresh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  // get password from user
  // check for password match
  // change password
  // return response
  const { currentPassword, newPassword } = req.body;

  if (!(currentPassword || newPassword)) {
    throw new ApiError(400, "Current and new Password required");
  }

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = user.isPasswordCorrect(currentPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .staus(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "CurrentUser Fetched Successfully"));
});
// Account details update
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "fullName and email required");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});
// Avatar apdate
const updateUserAvatar = asyncHandler(async (req, res) => {
  const localFilePathAvatar = req.file?.path;

  if (!localFilePathAvatar) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(localFilePathAvatar);
  if (!avatar.url) {
    throw new ApiError(500, "Error uploading avatar on cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});
// Cover Image Update
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const localFilePathCover = req.file?.path;

  if (!localFilePathCover) {
    throw new ApiError(400, "Cover image is required");
  }

  const coverImage = await uploadOnCloudinary(localFilePathCover);
  if (!coverImage.url) {
    throw new ApiError(500, "Error uploading avatar on cloudinary");
  }

  // TODO : Delete the image after uploading on cloudinary

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;

  if (!userName?.trim()) {
    throw new ApiError(400, "User name is required");
  }

  const channel = await User.aggregate([
    {
      $match: {
        userName: userName?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addfields: {
        subscriberCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        avatar: 1,
        coverImage: 1,
        email : 1
        subscriberCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);
  // TODO : Check channle data type
  console.log(channel);

  if(!channel?.length) {
    throw new ApiError(404, "Channel not found");
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200,channel[0],"Channel profile fetched successfully")
  )
});

const getWatchHistory = asyncHandler(async (req,res) => {
  const user = await User.aggregate([
    {
      $match : {
        _id : new mongoose.Types.ObjectId(req.user?._id)
      }
    }
    {
      $lookup : {
        from : "videos",
        localField : "watchHistory",
        foreignField : "_id",
        as : "watchHistory",
        pipeline : [
          {
            $lookup : {
              from : "users",
              localField : "owner",
              foreignField : "_id",
              as : "owner",
              pipeline : [
                {
                  $project : {
                    fullName : 1,
                    userName : 1,
                    avatar : 1
                  }
                }
              ]
            }
          },
          {
            $addFields : {
              $first : "$owner"
            }
          }
        ]
        
      }
    }
  ])

  return res
  .status(200)
  .json(
    new ApiResponse(200,user[0].watchHistory,"watch history fetched successfully")
  )
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};
