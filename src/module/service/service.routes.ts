import { Router } from "express";
import { getServices } from "./service.controller.js";

const router = Router();

router.get("/", getServices);

export const serviceRoutes = router;
