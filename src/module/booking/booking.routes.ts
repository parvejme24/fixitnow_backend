import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireCustomer } from "../../middleware/customer.js";
import {
    createBooking,
    getBookingDetails,
    getBookings,
} from "./booking.controller.js";

const router = Router();

router.use(authenticate, requireCustomer);

router.post("/", createBooking);
router.get("/", getBookings);
router.get("/:id", getBookingDetails);

export const bookingRoutes = router;
