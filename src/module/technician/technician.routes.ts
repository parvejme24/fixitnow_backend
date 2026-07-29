import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/admin.js";
import { requireTechnician } from "../../middleware/technician.js";
import { getTechnicianReviews } from "../review/review.controller.js";
import {
    createAvailability,
    deleteAvailability,
    getTechnicianProfile,
    getTechnicianSlots,
    getTechnicians,
    getTopTechnicians,
    updateAvailability,
    updateCategories,
    updateProfile,
    updateSkills,
    verifyTechnician,
} from "./technician.controller.js";

const router = Router();

router.get("/", getTechnicians);
router.get("/top", getTopTechnicians);

router.patch("/me", authenticate, requireTechnician, updateProfile);
router.put("/me/categories", authenticate, requireTechnician, updateCategories);
router.put("/me/skills", authenticate, requireTechnician, updateSkills);
router.post("/me/slots", authenticate, requireTechnician, createAvailability);
router.patch(
    "/me/slots/:slotId",
    authenticate,
    requireTechnician,
    updateAvailability
);
router.delete(
    "/me/slots/:slotId",
    authenticate,
    requireTechnician,
    deleteAvailability
);

router.patch("/:id/verify", authenticate, requireAdmin, verifyTechnician);
router.get("/:id/reviews", getTechnicianReviews);
router.get("/:id/slots", getTechnicianSlots);
router.get("/:id", getTechnicianProfile);

export const technicianRoutes = router;
