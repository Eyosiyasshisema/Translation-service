import express from "express";
import * as authController from "../controllers/auths.js";
const authRouter= express.Router();

authRouter.post("/register",authController.register);
authRouter.post("/login",authController.login);

export default authRouter;