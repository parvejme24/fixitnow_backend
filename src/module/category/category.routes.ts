import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/admin.js";
import {
    createCategory,
    deleteCategory,
    getAdminCategories,
    getCategories,
    getCategory,
    getCategoryStats,
    toggleCategoryVisibility,
    updateCategory,
} from "./category.controller.js";

const router = Router();

// ─────────────────────────────────────────────
// Public routes
// ─────────────────────────────────────────────
router.get("/", getCategories); // visible categories only (customer cards / search)

// ─────────────────────────────────────────────
// Admin routes (static paths before /:id)
// ─────────────────────────────────────────────
router.get("/stats", authenticate, requireAdmin, getCategoryStats); // categories, liveInSearch, servicesListed, jobsAllTime
router.get("/manage", authenticate, requireAdmin, getAdminCategories); // all categories (incl. hidden)
router.post("/", authenticate, requireAdmin, createCategory); // create (name, slug, icon, isVisible)

// ─────────────────────────────────────────────
// Public + Admin by id
// ─────────────────────────────────────────────
router.get("/:id", getCategory); // one visible category (public)
router.patch("/:id", authenticate, requireAdmin, updateCategory); // update category
router.patch(
    "/:id/visibility",
    authenticate,
    requireAdmin,
    toggleCategoryVisibility
); // hide / unhide on customer cards
router.delete("/:id", authenticate, requireAdmin, deleteCategory); // delete category

export const categoryRoutes = router;
