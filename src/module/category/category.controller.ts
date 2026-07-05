import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import * as categoryService from "./category.service.js";

export const getCategories = catchAsync(async (req: Request, res: Response) => {
    const categories = await categoryService.getAllCategories();

    res.status(200).json({
        success: true,
        message: "Categories fetched successfully",
        data: categories,
    });
});
