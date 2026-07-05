import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import {
    createCategorySchema,
    updateCategorySchema,
} from "./category.interface.js";
import * as categoryService from "./category.service.js";

export const getCategories = catchAsync(async (req: Request, res: Response) => {
    const categories = await categoryService.getAllCategories();

    res.status(200).json({
        success: true,
        message: "Categories fetched successfully",
        data: categories,
    });
});

export const createCategory = catchAsync(async (req: Request, res: Response) => {
    const payload = createCategorySchema.parse(req.body);
    const category = await categoryService.createCategory(payload);

    res.status(201).json({
        success: true,
        message: "Category created successfully",
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
        message: "Category updated successfully",
        data: category,
    });
});

export const deleteCategory = catchAsync(async (req: Request, res: Response) => {
    const category = await categoryService.deleteCategory(req.params.id as string);

    res.status(200).json({
        success: true,
        message: "Category deleted successfully",
        data: category,
    });
});
