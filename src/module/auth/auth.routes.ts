import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import {
    changePassword,
    forgotPassword,
    getMe,
    login,
    logout,
    register,
    resetPassword,
    updateMe,
} from "./auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, updateMe);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", authenticate, changePassword);

export const authRoutes = router;
