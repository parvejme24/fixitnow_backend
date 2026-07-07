import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { Role } from "../../../generated/prisma/enums.js";
import config from "../../config/index.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { JwtPayload, LoginInput, RegisterInput, UpdateProfileInput } from "./auth.interface.js";

const userSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    role: true,
    status: true,
    createdAt: true,
    updatedAt: true,
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

    const hashedPassword = await bcrypt.hash(payload.password, 12);

    const user = await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
            data: {
                name: payload.name,
                email: payload.email,
                password: hashedPassword,
                phone: payload.phone,
                role: payload.role as Role,
            },
            select: userSelect,
        });

        if (payload.role === "TECHNICIAN") {
            await tx.technicianProfile.create({
                data: {
                    userId: createdUser.id,
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
            password: true,
        },
    });

    if (!user) {
        throw new AppError("Invalid email or password", 401);
    }

    if (user.status === "BANNED") {
        throw new AppError("Your account has been banned", 403);
    }

    const isPasswordValid = await bcrypt.compare(payload.password, user.password);

    if (!isPasswordValid) {
        throw new AppError("Invalid email or password", 401);
    }

    const { password, ...userWithoutPassword } = user;

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
                    bio: true,
                    skills: true,
                    experienceYears: true,
                    hourlyRate: true,
                    location: true,
                    avgRating: true,
                    totalReviews: true,
                },
            },
        },
    });

    if (!user) {
        throw new AppError("User not found", 404);
    }

    if (user.status === "BANNED") {
        throw new AppError("Your account has been banned", 403);
    }

    return user;
};

export const updateUserProfile = async (
    userId: string,
    payload: UpdateProfileInput
) => {
    const data: {
        name?: string;
        phone?: string;
        password?: string;
    } = {};

    if (payload.name !== undefined) {
        data.name = payload.name;
    }

    if (payload.phone !== undefined) {
        data.phone = payload.phone;
    }

    if (payload.password) {
        data.password = await bcrypt.hash(payload.password, 12);
    }

    return prisma.user.update({
        where: { id: userId },
        data,
        select: {
            ...userSelect,
            technicianProfile: {
                select: {
                    id: true,
                    bio: true,
                    skills: true,
                    experienceYears: true,
                    hourlyRate: true,
                    location: true,
                    avgRating: true,
                    totalReviews: true,
                },
            },
        },
    });
};
