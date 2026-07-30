import { z } from "zod";
import { paginationSchema } from "../service/service.interface.js";

export const registerSchema = z
    .object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        phone: z.string().min(1, "Phone is required"),
        role: z.enum(["CUSTOMER", "TECHNICIAN", "ADMIN"], {
            message: "Role must be CUSTOMER, TECHNICIAN, or ADMIN",
        }),
        trade: z.string().min(2, "Trade must be at least 2 characters").optional(),
    })
    .superRefine((data, ctx) => {
        if (data.role === "TECHNICIAN" && !data.trade) {
            ctx.addIssue({
                code: "custom",
                path: ["trade"],
                message: "Trade is required when registering as a technician",
            });
        }
    });

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export const updateMeSchema = z
    .object({
        name: z.string().min(2, "Name must be at least 2 characters").optional(),
        phone: z.string().optional(),
        initials: z.string().min(1).max(4).optional(),
    })
    .refine(
        (data) => Object.values(data).some((value) => value !== undefined),
        {
            message: "At least one field is required to update",
        }
    );

export const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, "Reset token is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const authUserQuerySchema = paginationSchema.extend({
    role: z.enum(["CUSTOMER", "TECHNICIAN", "ADMIN"]).optional(),
    isActive: z.coerce.boolean().optional(),
    search: z.string().optional(),
});

export const updateUserRoleSchema = z.object({
    role: z.enum(["CUSTOMER", "TECHNICIAN", "ADMIN"], {
        message: "Role must be CUSTOMER, TECHNICIAN, or ADMIN",
    }),
    trade: z.string().min(2).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type AuthUserQuery = z.infer<typeof authUserQuerySchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

export type JwtPayload = {
    userId: string;
    email: string;
    role: "CUSTOMER" | "TECHNICIAN" | "ADMIN";
};
