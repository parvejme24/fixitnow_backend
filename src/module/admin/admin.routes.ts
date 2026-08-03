import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/admin.js";
import {
    getBookings,
    getSales,
    getStats,
    getUsers,
    updateUserStatus,
} from "./admin.controller.js";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/stats", getStats);
router.get("/sales", getSales);
router.get("/users", getUsers);
router.patch("/users/:id", updateUserStatus);
router.get("/bookings", getBookings);

export const adminRoutes = router;
