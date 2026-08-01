import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/admin.js";
import {
    createArea,
    deleteArea,
    getArea,
    getAreas,
    updateArea,
} from "./area.controller.js";

const router = Router();

// Public
router.get("/", getAreas);
router.get("/:id", getArea);

// Admin
router.post("/", authenticate, requireAdmin, createArea);
router.patch("/:id", authenticate, requireAdmin, updateArea);
router.delete("/:id", authenticate, requireAdmin, deleteArea);

export const areaRoutes = router;
