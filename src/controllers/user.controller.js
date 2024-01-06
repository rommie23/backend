import {asyncHandler} from '../utils/asyncHandler.js'
import { ApiErrors } from '../utils/APIErrors.js';
import { User } from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        // console.log('accessToken', accessToken)
        const refreshToken =  user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiErrors(500, 'something went wrong while generating access token')
    }
}


//////////////////REGISTERING NEW USER //////////////////////////
const registerUser = asyncHandler( async(req,res)=>{
    
    // first we will recieve some data
    // then we will check data if everything is according to models then next or send error
    // check if user already exist(we will use email, username)
    // check for images, check for avatar
    // upload images to cloudinary, avatar
    // create user object - create entry in DB
    // remove password and refresh token field from response
    // check for user creation
    // return response

    const {fullname, email, username, password} = req.body
    // console.log("req.body",req.body);
    
    if (
        [fullname, email, username, password].some((field)=>
        field?.trim() ==="")
    ) {
        throw new ApiErrors(400, 'all fields are required')
    }

    const existedUser = await User.findOne({
        $or:[{username} , {email}]
    })

    if (existedUser) {
        throw new ApiErrors( 409, 'username or email already exist')
    }
    console.log("req.file",req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // console.log(avatarLocalPath);

    // const coverLocalPath = req.files?.coverImage[0]?.path;

    let coverLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length> 0){
        coverLocalPath = req.files.coverImage[0].path
    }
    // if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    //     coverLocalPath = req.files.coverImage[0].path
    // }

    if (!avatarLocalPath) {
        throw new ApiErrors(400, 'avatar image is required, localPath error')
    }
     
    const avatar= await uploadOnCloudinary(avatarLocalPath)
    // console.log(avatar);
    const coverImage = await uploadOnCloudinary(coverLocalPath)

    if(!avatar){
        throw new ApiErrors(400, 'avatar image is required')
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase(),
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiErrors(500, "Something went wrong while registering user!!")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, 'user registered')
    )

} )

///////////////////USER LOGIN ///////////////////

const loginUser = asyncHandler(async(req, res)=>{
// take data from user request(req body)
// verify data if email is already there or user have to register
// password check
// successful verification will give access and refresh token to user
// send cookies
    const {email, username, password} = req.body

    if(!email){
        throw new ApiErrors(400, 'username or email required')
    }
    const user = await User.findOne({
        $or:[{username}, {email}]
    })
    if(!user){
        throw new ApiErrors(404, 'user not found please check field or register')
    }
    const isPasswordValid =  await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiErrors(401, 'invalid user credentials')
    }
    const{accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
    // console.log("accToken is",accessToken)



    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure : true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200,
            {
            user: loggedInUser, refreshToken, accessToken
        },
        "user logged in successfully"
        
        )
    )

})

///////////////// USER LOGOUT //////////////////////

const logoutUser=asyncHandler(async(req,res)=>{
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure : true
    }
    return res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(200, {}, "user logout in"))
})

/////////////////// TOKENS /////////////////////////
const refreshAccessToken = asyncHandler(async(req, res)=>{
    const incomingRefreshToken = req.body.refreshToken || req.cookie.refreshToken
    if(!incomingRefreshToken){
        throw new ApiErrors(401, 'unauthorized request of incomingRefToken')
    }

    try {
        const decodedToken =  jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
        const user = User.findById(decodedToken?._id)
        if(!user){
            throw new ApiErrors(401, 'invalid refresh token')
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiErrors(401, "refresh token expired or used")
        }
    
        const options={
            httpOnly: true,
            secure:true
        }
        const {accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)
        return res
        .status(200)
        .cookie("accessToken", accessToken, options )
        .cookie("refreshToken", newRefreshToken, options )
        .json(
            200,
            {accessToken,
            refreshToken: newRefreshToken},
            "access token refrehsed successfully"
        )
    } catch (error) {
        throw new ApiErrors(401, error?.message || "invalid refreshToken")
    }
})

////////////////// CHANGE PASSWORD //////////////////
const changeCurrentPassword = asyncHandler(async(req, res)=>{
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiErrors(400, "invalid old password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res.status(200).json(new ApiResponse(
        200,
        {}, 
        "Password changed successfully"))

})

///////////// CURRENT USER////////////
const getCurrentUser = asyncHandler(async(req, res)=>{
    return res
    .status(200)
    .json(new ApiResponse(
        200, 
        req.user, 
        "current user fetched successfully"
        ))
})

////////UPDATE ACCOUNT DETAILS //////////

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullname, email, confPassword}= req.body

    if ((!fullname || !email) && !confPassword) {
        throw new ApiErrors(400, "all fields are required")
    }
    const user = await User.findById(req.user?._id)
    if (!confPassword === user.password) {
        throw new ApiErrors(400, "invalid password")
    }
    const setUser = await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            fullname,
            email
        },
    },
    {new: true}
    ).select("-password")
    return res.status(200)
    .json(new ApiResponse(200, setUser, "Account details updated successfully"))
})

////////////UPDATE USER AVATAR ///////////////
const updateUserAvatar = asyncHandler(async(req, res)=>{
    const avatartLocalPath = req.file?.path

    if(!avatartLocalPath){
        throw new ApiErrors(400, "avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatartLocalPath)

    if(!avatar.url){
        throw new ApiErrors(400, "error while uploading avatar")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            avatar: avatar.url
        }
    },
    {new: true}).select("-password")

    // delete avatar old image 
    if (user) {
        await deleteCloudinary(avatar)
    }

    return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar image updated"))
})


/////// update cover image

const updateUserCoverImage = asyncHandler(async(req, res)=>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiErrors(400, "coverImage file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiErrors(400, "error while uploading coverImage")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            coverImage: coverImage.url
        }
    },
    {new: true}).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "cover image updated"))
})

//////////////////// get User Channel Profile //////////////
const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params
    if (!username?.trim()) {
        throw new ApiErrors(400,"username is missing    ")
    }
    const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            },
        },
        {
            $lookup:{
             from:"subscriptions",
             localField:"_id",
             foreignField:"channel",
             as:"subscribers"   
            }
        },
        {
            $lookup:{
             from:"subscriptions",
             localField:"_id",
             foreignField:"subscriber",
             as:"subscribedTo"
            }
        },{
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in: [req.user?._id, "$subscribers.subscriber"]},
                        then:true,
                        else:false  
                    }
                }
            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1,
                createdAt:1
            }
        }
    ])
    console.log(channel)
    if (!channel?.length) {
        throw ApiErrors(404, 'channel not available')
    }
    return res
    .status(200)
    .json(new ApiResponse(200, channel[0], 'user channel fetched successfully'))
})

////////////////// get watch history ///////////////////

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:true,
                                        username:true,
                                        avatar:true,
                                    }

                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                    $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "watch history fetched successfully"))
})
export {registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser,updateAccountDetails, updateUserAvatar, updateUserCoverImage,getUserChannelProfile, getWatchHistory}