import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/admin.js";
import { getServiceReviews } from "../review/review.controller.js";
import {
    createService,
    deleteService,
    getFeaturedServices,
    getServiceDetails,
    getServices,
    updateService,
} from "./service.controller.js";

const router = Router();

router.get("/", getServices);
router.get("/featured", getFeaturedServices);
router.get("/:id/reviews", getServiceReviews);
router.get("/:id", getServiceDetails);
router.post("/", authenticate, requireAdmin, createService);
router.patch("/:id", authenticate, requireAdmin, updateService);
router.delete("/:id", authenticate, requireAdmin, deleteService);

export const serviceRoutes = router;
