import { NextFunction, Request, Response, Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireCustomer } from "../../middleware/customer.js";
import { requireTechnician } from "../../middleware/technician.js";
import { AppError } from "../../utils/AppError.js";
import {
    acceptBooking,
    cancelBooking,
    createBooking,
    declineBooking,
    getBookingDetails,
    getBookings,
    updateBookingStatus,
} from "./booking.controller.js";

const requireTechOrAdmin = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.user?.role === "TECHNICIAN" || req.user?.role === "ADMIN") {
        return next();
    }
    next(new AppError("Technician or admin access required", 403));
};

const router = Router();

router.use(authenticate);

router.post("/", requireCustomer, createBooking);
router.get("/", getBookings);
router.get("/:id", getBookingDetails);
router.post("/:id/accept", requireTechnician, acceptBooking);
router.post("/:id/decline", requireTechnician, declineBooking);
router.post("/:id/cancel", requireCustomer, cancelBooking);
router.patch("/:id/status", requireTechOrAdmin, updateBookingStatus);

export const bookingRoutes = router;
