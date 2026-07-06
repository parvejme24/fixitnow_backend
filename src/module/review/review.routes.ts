import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireCustomer } from "../../middleware/customer.js";
import { createReview } from "./review.controller.js";

const router = Router();

router.use(authenticate, requireCustomer);

router.post("/", createReview);

export const reviewRoutes = router;
