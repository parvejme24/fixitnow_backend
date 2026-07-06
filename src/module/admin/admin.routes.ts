import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/admin.js";
import {
    createCategory,
    deleteCategory,
    updateCategory,
} from "../category/category.controller.js";
import {
    getBookings,
    getCategories,
    getUsers,
    updateUserStatus,
} from "./admin.controller.js";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/users", getUsers);
router.patch("/users/:id", updateUserStatus);
router.get("/bookings", getBookings);
router.get("/categories", getCategories);
router.post("/categories", createCategory);
router.patch("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

export const adminRoutes = router;
