import {asyncHandler} from '../utils/asyncHandler.js'
import { ApiErrors } from '../utils/APIErrors.js';
import { User } from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js';

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

export {registerUser}