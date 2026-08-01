import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import {
    createCategorySchema,
    toggleCategoryVisibilitySchema,
    updateCategorySchema,
} from "./category.interface.js";
import * as categoryService from "./category.service.js";

// ── Public ──────────────────────────────────────────────────

export const getCategories = catchAsync(async (req: Request, res: Response) => {
    const categories = await categoryService.getAllCategories();

    res.status(200).json({
        success: true,
        data: categories,
    });
});

export const getCategory = catchAsync(async (req: Request, res: Response) => {
    const category = await categoryService.getCategoryById(
        req.params.id as string
    );

    res.status(200).json({
        success: true,
        data: category,
    });
});

// ── Admin ───────────────────────────────────────────────────

export const getAdminCategories = catchAsync(
    async (req: Request, res: Response) => {
        const categories = await categoryService.getAllCategories({
            includeHidden: true,
        });

        res.status(200).json({
            success: true,
            data: categories,
        });
    }
);

export const getCategoryStats = catchAsync(
    async (req: Request, res: Response) => {
        const stats = await categoryService.getCategoryStats();

        res.status(200).json({
            success: true,
            data: stats,
        });
    }
);

export const createCategory = catchAsync(async (req: Request, res: Response) => {
    const payload = createCategorySchema.parse(req.body);
    const category = await categoryService.createCategory(payload);

    res.status(201).json({
        success: true,
        data: category,
    });
});

export const updateCategory = catchAsync(async (req: Request, res: Response) => {
    const payload = updateCategorySchema.parse(req.body);
    const category = await categoryService.updateCategory(
        req.params.id as string,
        payload
    );

    res.status(200).json({
        success: true,
        data: category,
    });
});

export const toggleCategoryVisibility = catchAsync(
    async (req: Request, res: Response) => {
        const payload = toggleCategoryVisibilitySchema.parse(req.body);
        const category = await categoryService.toggleCategoryVisibility(
            req.params.id as string,
            payload
        );

        res.status(200).json({
            success: true,
            data: category,
        });
    }
);

export const deleteCategory = catchAsync(async (req: Request, res: Response) => {
    const category = await categoryService.deleteCategory(
        req.params.id as string
    );

    res.status(200).json({
        success: true,
        data: category,
    });
});
