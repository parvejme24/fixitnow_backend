import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/admin.js";
import {
    createCategory,
    deleteCategory,
    getCategories,
    updateCategory,
} from "./category.controller.js";

const publicRouter = Router();
const adminRouter = Router();

publicRouter.get("/", getCategories);

adminRouter.use(authenticate, requireAdmin);
adminRouter.post("/", createCategory);
adminRouter.patch("/:id", updateCategory);
adminRouter.delete("/:id", deleteCategory);

export const categoryRoutes = publicRouter;
export const adminCategoryRoutes = adminRouter;
