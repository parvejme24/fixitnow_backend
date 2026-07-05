import { Router } from "express";
import {
    getTechnicianProfile,
    getTechnicians,
} from "./technician.controller.js";

const router = Router();

router.get("/", getTechnicians);
router.get("/:id", getTechnicianProfile);

export const technicianRoutes = router;
