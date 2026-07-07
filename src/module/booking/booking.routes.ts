import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireCustomer } from "../../middleware/customer.js";
import {
    cancelBooking,
    createBooking,
    getBookingDetails,
    getBookings,
} from "./booking.controller.js";

const router = Router();

router.use(authenticate, requireCustomer);

router.post("/", createBooking);
router.get("/", getBookings);
router.get("/:id", getBookingDetails);
router.patch("/:id", cancelBooking);

export const bookingRoutes = router;
