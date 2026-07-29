import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { randomBytes, randomUUID } from "node:crypto";
import { Role } from "../../../generated/prisma/enums.js";
import config from "../../config/index.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import {
    ChangePasswordInput,
    ForgotPasswordInput,
    JwtPayload,
    LoginInput,
    RegisterInput,
    ResetPasswordInput,
    UpdateMeInput,
} from "./auth.interface.js";

const userSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    role: true,
    initials: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
};

const getInitials = (name: string) => {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
};

const signToken = (payload: JwtPayload) => {
    const options: SignOptions = {
        expiresIn: config.jwt_expires_in as SignOptions["expiresIn"],
    };

    return jwt.sign(payload, config.jwt_secret, options);
};

export const registerUser = async (payload: RegisterInput) => {
    const existingUser = await prisma.user.findUnique({
        where: { email: payload.email },
    });

    if (existingUser) {
        throw new AppError("Email is already registered", 409);
    }

    if (payload.phone) {
        const existingPhone = await prisma.user.findUnique({
            where: { phone: payload.phone },
        });

        if (existingPhone) {
            throw new AppError("Phone number is already registered", 409);
        }
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);
    const initials = getInitials(payload.name);

    const user = await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
            data: {
                name: payload.name,
                email: payload.email,
                passwordHash,
                phone: payload.phone,
                role: payload.role as Role,
                initials,
            },
            select: userSelect,
        });

        if (payload.role === "TECHNICIAN") {
            await tx.technicianProfile.create({
                data: {
                    id: randomUUID(),
                    userId: createdUser.id,
                    trade: payload.trade || "General",
                    initials,
                    visitFee: 0,
                },
            });
        }

        return createdUser;
    });

    const token = signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
    });

    return { user, token };
};

export const loginUser = async (payload: LoginInput) => {
    const user = await prisma.user.findUnique({
        where: { email: payload.email },
        select: {
            ...userSelect,
            passwordHash: true,
        },
    });

    if (!user) {
        throw new AppError("Invalid email or password", 401);
    }

    if (!user.isActive) {
        throw new AppError("Your account has been banned", 403);
    }

    const isPasswordValid = await bcrypt.compare(
        payload.password,
        user.passwordHash
    );

    if (!isPasswordValid) {
        throw new AppError("Invalid email or password", 401);
    }

    const { passwordHash, ...userWithoutPassword } = user;

    const token = signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
    });

    return { user: userWithoutPassword, token };
};

export const getCurrentUser = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            ...userSelect,
            technicianProfile: {
                select: {
                    id: true,
                    trade: true,
                    bio: true,
                    areaId: true,
                    visitFee: true,
                    experienceYrs: true,
                    jobsCompleted: true,
                    ratingAvg: true,
                    reviewCount: true,
                    online: true,
                    verified: true,
                },
            },
        },
    });

    if (!user) {
        throw new AppError("User not found", 404);
    }

    if (!user.isActive) {
        throw new AppError("Your account has been banned", 403);
    }

    return user;
};

export const updateMe = async (userId: string, payload: UpdateMeInput) => {
    const data: {
        name?: string;
        phone?: string;
        initials?: string;
    } = {};

    if (payload.name !== undefined) {
        data.name = payload.name;
        data.initials = payload.initials ?? getInitials(payload.name);
    }

    if (payload.phone !== undefined) {
        data.phone = payload.phone;
    }

    if (payload.initials !== undefined && payload.name === undefined) {
        data.initials = payload.initials;
    }

    return prisma.user.update({
        where: { id: userId },
        data,
        select: {
            ...userSelect,
            technicianProfile: {
                select: {
                    id: true,
                    trade: true,
                    bio: true,
                    areaId: true,
                    visitFee: true,
                    experienceYrs: true,
                    jobsCompleted: true,
                    ratingAvg: true,
                    reviewCount: true,
                    online: true,
                    verified: true,
                },
            },
        },
    });
};

export const forgotPassword = async (payload: ForgotPasswordInput) => {
    const user = await prisma.user.findUnique({
        where: { email: payload.email },
        select: { id: true, email: true },
    });

    // Always return success to avoid email enumeration
    if (!user) {
        return {
            message: "If that email exists, a reset token has been issued",
        };
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
        data: {
            token,
            userId: user.id,
            expiresAt,
        },
    });

    // No email provider wired — expose token in non-production for testing
    if (config.node_env !== "production") {
        return {
            message: "Password reset token generated",
            resetToken: token,
            expiresAt,
        };
    }

    return {
        message: "If that email exists, a reset token has been issued",
    };
};

export const resetPassword = async (payload: ResetPasswordInput) => {
    const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token: payload.token },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
        throw new AppError("Invalid or expired reset token", 400);
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);

    await prisma.$transaction([
        prisma.user.update({
            where: { id: resetToken.userId },
            data: { passwordHash },
        }),
        prisma.passwordResetToken.update({
            where: { id: resetToken.id },
            data: { usedAt: new Date() },
        }),
    ]);

    return { message: "Password reset successfully" };
};

export const changePassword = async (
    userId: string,
    payload: ChangePasswordInput
) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
    });

    if (!user) {
        throw new AppError("User not found", 404);
    }

    const isValid = await bcrypt.compare(
        payload.currentPassword,
        user.passwordHash
    );

    if (!isValid) {
        throw new AppError("Current password is incorrect", 400);
    }

    const passwordHash = await bcrypt.hash(payload.newPassword, 12);

    await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
    });

    return { message: "Password changed successfully" };
};
