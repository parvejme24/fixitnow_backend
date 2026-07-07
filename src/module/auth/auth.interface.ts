import { z } from "zod";

export const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z.string().optional(),
    role: z.enum(["CUSTOMER", "TECHNICIAN"], {
        message: "Role must be CUSTOMER or TECHNICIAN",
    }),
});

export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z
    .object({
        name: z.string().min(2, "Name must be at least 2 characters").optional(),
        phone: z.string().optional(),
        password: z
            .string()
            .min(6, "Password must be at least 6 characters")
            .optional(),
    })
    .refine((data) => Object.values(data).some((value) => value !== undefined), {
        message: "At least one field is required to update",
    });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export type JwtPayload = {
    userId: string;
    email: string;
    role: "CUSTOMER" | "TECHNICIAN" | "ADMIN";
};
