import { User } from "../models/user.model.js";
// import { ApiErrors } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken'

export const verifyJWT = asyncHandler(async(req, res, next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", '')
    
        if (!token) {
            throw ApiErrors(401, "unauthorized request")
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken._id).select("-password -refreshToken")
        if (!user) {
            // TODO: discuss about frontend 
            throw new ApiErrors(401, 'Invalid access token')
    
        }
        req.user = user
        next()
    } catch (error) {
        throw new ApiErrors(401, error?.message || 'invalid accessToken')
    }
})