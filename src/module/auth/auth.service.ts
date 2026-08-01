import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import { Prisma } from "../../../generated/prisma/client.js";
import { Role } from "../../../generated/prisma/enums.js";
import config from "../../config/index.js";
import { uploadProfileImage } from "../../lib/cloudinary.js";
import {
    sendLoginNotifyEmail,
    sendPasswordChangedEmail,
    sendPasswordResetEmail,
    sendRoleChangedEmail,
    sendWelcomeEmail,
} from "../../lib/email.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import {
    AuthUserQuery,
    ChangePasswordInput,
    ForgotPasswordInput,
    JwtPayload,
    LoginInput,
    RegisterInput,
    ResetPasswordInput,
    UpdateMeInput,
    UpdateUserRoleInput,
} from "./auth.interface.js";

const userSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    role: true,
    initials: true,
    profileImage: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
};

const technicianProfileSelect = {
    id: true,
    trade: true,
    bio: true,
    visitFee: true,
    experienceYrs: true,
    jobsCompleted: true,
    ratingAvg: true,
    reviewCount: true,
    online: true,
    verified: true,
    areas: {
        select: {
            area: {
                select: { id: true, name: true },
            },
        },
    },
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

    // Notify user by email (do not fail registration if SMTP fails)
    try {
        await sendWelcomeEmail(user.email, user.name, user.role);
    } catch (error) {
        console.error("Welcome email failed:", error);
    }

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

    // Login security notify (do not fail login if SMTP fails)
    try {
        await sendLoginNotifyEmail(user.email, user.name);
    } catch (error) {
        console.error("Login notify email failed:", error);
    }

    return { user: userWithoutPassword, token };
};

const mapUserWithProfile = <
    T extends {
        technicianProfile: {
            areas: { area: { id: string; name: string } }[];
        } | null;
    },
>(
    user: T
) => {
    if (!user.technicianProfile) {
        return user;
    }

    const { areas, ...profile } = user.technicianProfile;
    return {
        ...user,
        technicianProfile: {
            ...profile,
            areas: areas.map((item) => item.area),
        },
    };
};

export const getCurrentUser = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            ...userSelect,
            technicianProfile: { select: technicianProfileSelect },
        },
    });

    if (!user) {
        throw new AppError("User not found", 404);
    }

    if (!user.isActive) {
        throw new AppError("Your account has been banned", 403);
    }

    return mapUserWithProfile(user);
};

export const updateMe = async (
    userId: string,
    payload: UpdateMeInput,
    file?: Express.Multer.File
) => {
    const data: {
        name?: string;
        phone?: string;
        initials?: string;
        profileImage?: string;
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

    if (file) {
        const uploaded = await uploadProfileImage(file.buffer);
        data.profileImage = uploaded.url;
    }

    if (Object.keys(data).length === 0) {
        throw new AppError("At least one field or profile image is required", 400);
    }

    const user = await prisma.user.update({
        where: { id: userId },
        data,
        select: {
            ...userSelect,
            technicianProfile: { select: technicianProfileSelect },
        },
    });

    return mapUserWithProfile(user);
};

export const forgotPassword = async (payload: ForgotPasswordInput) => {
    const user = await prisma.user.findUnique({
        where: { email: payload.email },
        select: { id: true, email: true, name: true },
    });

    // Always return success to avoid email enumeration
    if (!user) {
        return {
            message: "If that email exists, a reset link has been sent",
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

    const resetUrl = `${config.app_url}/reset-password?token=${token}`;

    await sendPasswordResetEmail(user.email, user.name, resetUrl);

    const response: {
        message: string;
        resetToken?: string;
        expiresAt?: Date;
    } = {
        message: "If that email exists, a reset link has been sent",
    };

    // Helpful for local testing without checking inbox
    if (!config.is_production) {
        response.resetToken = token;
        response.expiresAt = expiresAt;
    }

    return response;
};

export const resetPassword = async (payload: ResetPasswordInput) => {
    const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token: payload.token },
        include: {
            user: { select: { id: true, email: true, name: true } },
        },
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

    await sendPasswordChangedEmail(
        resetToken.user.email,
        resetToken.user.name
    );

    return { message: "Password reset successfully" };
};

export const changePassword = async (
    userId: string,
    payload: ChangePasswordInput
) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true, email: true, name: true },
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

    await sendPasswordChangedEmail(user.email, user.name);

    return { message: "Password changed successfully" };
};

export const getAllUsers = async (query: AuthUserQuery) => {
    const { page, limit, role, isActive, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
        ...(search && {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
            ],
        }),
    };

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: {
                ...userSelect,
                technicianProfile: {
                    select: {
                        id: true,
                        trade: true,
                        ratingAvg: true,
                        verified: true,
                    },
                },
            },
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({ where }),
    ]);

    return {
        users,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const updateUserRole = async (
    userId: string,
    payload: UpdateUserRoleInput,
    adminId: string
) => {
    if (userId === adminId) {
        throw new AppError("You cannot change your own role", 400);
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { technicianProfile: true },
    });

    if (!user) {
        throw new AppError("User not found", 404);
    }

    if (user.role === payload.role) {
        throw new AppError(`User already has role ${payload.role}`, 400);
    }

    const oldRole = user.role;
    const newRole = payload.role as Role;

    const updated = await prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
            where: { id: userId },
            data: { role: newRole },
            select: {
                ...userSelect,
                technicianProfile: {
                    select: {
                        id: true,
                        trade: true,
                        ratingAvg: true,
                        verified: true,
                    },
                },
            },
        });

        if (newRole === "TECHNICIAN" && !user.technicianProfile) {
            await tx.technicianProfile.create({
                data: {
                    userId,
                    trade: payload.trade || "General",
                    initials: user.initials || getInitials(user.name),
                    visitFee: 0,
                },
            });
        }

        return updatedUser;
    });

    await sendRoleChangedEmail(user.email, user.name, oldRole, newRole);

    return updated;
};
