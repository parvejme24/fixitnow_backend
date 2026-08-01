import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/admin.js";
import { uploadProfileImageMiddleware } from "../../middleware/imageUpload.js";
import {
    changePassword,
    forgotPassword,
    getMe,
    getUsers,
    login,
    logout,
    register,
    resetPassword,
    updateMe,
    updateUserRole,
} from "./auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getMe);
router.patch(
    "/me",
    authenticate,
    uploadProfileImageMiddleware,
    updateMe
);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", authenticate, changePassword);

// Admin-only user management
router.get("/users", authenticate, requireAdmin, getUsers);
router.patch("/users/:id/role", authenticate, requireAdmin, updateUserRole);

export const authRoutes = router;
