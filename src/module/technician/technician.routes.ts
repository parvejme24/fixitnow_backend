import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireTechnician } from "../../middleware/technician.js";
import {
    createService,
    deleteService,
    getBookings,
    getServices,
    getTechnicianProfile,
    getTechnicians,
    updateAvailability,
    updateBookingStatus,
    updateProfile,
    updateService,
} from "./technician.controller.js";

const publicRouter = Router();
const managementRouter = Router();

publicRouter.get("/", getTechnicians);
publicRouter.get("/:id", getTechnicianProfile);

managementRouter.use(authenticate, requireTechnician);
managementRouter.put("/profile", updateProfile);
managementRouter.put("/availability", updateAvailability);
managementRouter.get("/services", getServices);
managementRouter.post("/services", createService);
managementRouter.patch("/services/:id", updateService);
managementRouter.delete("/services/:id", deleteService);
managementRouter.get("/bookings", getBookings);
managementRouter.patch("/bookings/:id", updateBookingStatus);

export const technicianRoutes = publicRouter;
export const technicianManagementRoutes = managementRouter;
