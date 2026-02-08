import { Request, Response } from "express";
import { prisma } from "@/shared/core/db";
import { ApiResponse } from "@/shared/utils/api-response";
import logger from "@/shared/core/logger";
import * as services from "./services";

/**
 * Get current user profile
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    return ApiResponse.success(res, user);
  } catch (error) {
    logger.error("[GET_CURRENT_USER]", error);
    return ApiResponse.error(res, "Internal server error");
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.userId;
    const { name, imageUrl } = req.body;

    const updatedData = await services.updateProfile(userId, {
      name,
      imageUrl,
    });

    return ApiResponse.success(res, updatedData);
  } catch (error) {
    logger.error("[UPDATE_PROFILE]", error);
    return ApiResponse.error(res, "Internal server error");
  }
};
