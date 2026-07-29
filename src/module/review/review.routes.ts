import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireCustomer } from "../../middleware/customer.js";
import { createReview, deleteReview } from "./review.controller.js";

const router = Router();

router.post("/", authenticate, requireCustomer, createReview);
router.delete("/:id", authenticate, deleteReview);

export const reviewRoutes = router;
