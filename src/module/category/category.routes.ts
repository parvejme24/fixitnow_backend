import { Router } from "express";
import { getAreas, getCategories, getCategory } from "./category.controller.js";

const router = Router();

router.get("/", getCategories);
router.get("/:id", getCategory);

export const categoryRoutes = router;

const areaRouter = Router();
areaRouter.get("/", getAreas);
export const areaRoutes = areaRouter;
