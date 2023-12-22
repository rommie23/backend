import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router()
router.route("/register").post(registerUser)    // full route will be http://localhost:8000/api/v1/users/register (registerUser is from controller line:2)

export default router