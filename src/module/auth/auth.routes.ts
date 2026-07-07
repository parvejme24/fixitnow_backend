import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { getMe, login, register, updateProfile } from "./auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.put("/profile", authenticate, updateProfile);

export const authRoutes = router;
