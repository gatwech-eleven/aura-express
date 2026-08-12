import { Request, Response } from "express";
import { prisma } from "@/shared/core/db";
import { ApiResponse } from "@/shared/utils/api-response";
import logger from "@/shared/core/logger";

/**
 * Get channel information
 */
export const getChannel = async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });
    return ApiResponse.success(res, channel);
  } catch (error) {
    logger.error("[GET_CHANNEL]", error);
    return ApiResponse.error(res, "Internal server error");
  }
};

/**
 * Get all channels for a server
 */
export const getServerChannels = async (req: Request, res: Response) => {
  try {
    const { cohortId } = req.params;
    const userId = res.locals.userId;

    if (!cohortId) {
      return ApiResponse.error(res, "Cohort ID missing", 400);
    }

    const currentMember = await prisma.cohortMember.findFirst({
      where: {
        cohortId,
        profile: { userId },
      },
    });

    if (!currentMember) {
      return ApiResponse.error(res, "Forbidden", 403);
    }

    const channels = await prisma.channel.findMany({
      where: { cohortId },
      orderBy: { createdAt: "asc" },
    });

    return ApiResponse.success(res, channels);
  } catch (error) {
    logger.error("[GET_SERVER_CHANNELS]", error);
    return ApiResponse.error(res, "Internal server error");
  }
};

/**
 * Get cohortMember information
 */
export const getMember = async (req: Request, res: Response) => {
  try {
    const { cohortMemberId } = req.params;
    const cohortMember = await prisma.cohortMember.findUnique({
      where: { id: cohortMemberId },
      include: { profile: true },
    });
    return ApiResponse.success(res, cohortMember);
  } catch (error) {
    logger.error("[GET_MEMBER]", error);
    return ApiResponse.error(res, "Internal server error");
  }
};

/**
 * Get all members for a server
 */
export const getServerMembers = async (req: Request, res: Response) => {
  try {
    const { cohortId } = req.params;
    const userId = res.locals.userId;

    if (!cohortId) {
      return ApiResponse.error(res, "Cohort ID missing", 400);
    }

    const currentMember = await prisma.cohortMember.findFirst({
      where: {
        cohortId,
        profile: { userId },
      },
    });

    if (!currentMember) {
      return ApiResponse.error(res, "Forbidden", 403);
    }

    const members = await prisma.cohortMember.findMany({
      where: { cohortId },
      include: { profile: true },
      orderBy: { role: "asc" },
    });

    return ApiResponse.success(res, members);
  } catch (error) {
    logger.error("[GET_SERVER_MEMBERS]", error);
    return ApiResponse.error(res, "Internal server error");
  }
};

/**
 * Create a new channel
 */
export const createChannel = async (req: Request, res: Response) => {
  try {
    const { cohortId } = req.query;
    const { name, type } = req.body;
    const userId = res.locals.userId;

    if (!cohortId || typeof cohortId !== "string") {
      return ApiResponse.error(res, "Cohort ID missing", 400);
    }

    if (!name) {
      return ApiResponse.error(res, "Channel name is required", 400);
    }

    const currentMember = await prisma.cohortMember.findFirst({
      where: {
        cohortId,
        profile: { userId },
        role: { in: ["ADMIN", "MODERATOR"] },
      },
    });

    if (!currentMember) {
      return ApiResponse.error(res, "Forbidden", 403);
    }

    const server = await prisma.cohort.update({
      where: { id: cohortId },
      data: {
        channels: {
          create: {
            name,
            type: type || "TEXT",
            profileId: currentMember.profileId,
          },
        },
      },
      include: {
        channels: { orderBy: { createdAt: "asc" } },
        cohortMembers: { include: { profile: true }, orderBy: { role: "asc" } },
      },
    });

    return ApiResponse.success(res, server);
  } catch (error) {
    logger.error("[CREATE_CHANNEL]", error);
    return ApiResponse.error(res, "Internal server error");
  }
};

/**
 * Update a channel
 */
export const updateChannel = async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;
    const { cohortId } = req.query;
    const { name, type } = req.body;
    const userId = res.locals.userId;

    if (!cohortId || typeof cohortId !== "string") {
      return ApiResponse.error(res, "Cohort ID missing", 400);
    }

    if (!channelId) {
      return ApiResponse.error(res, "Channel ID missing", 400);
    }

    const currentMember = await prisma.cohortMember.findFirst({
      where: {
        cohortId,
        profile: { userId },
        role: { in: ["ADMIN", "MODERATOR"] },
      },
    });

    if (!currentMember) {
      return ApiResponse.error(res, "Forbidden", 403);
    }

    const channel = await prisma.channel.findFirst({
      where: { id: channelId, cohortId },
    });

    if (!channel) {
      return ApiResponse.error(res, "Channel not found", 404);
    }

    if (channel.name === "general") {
      return ApiResponse.error(res, "Cannot edit general channel", 400);
    }

    const server = await prisma.cohort.update({
      where: { id: cohortId },
      data: {
        channels: {
          update: {
            where: { id: channelId },
            data: { name, type },
          },
        },
      },
      include: {
        channels: { orderBy: { createdAt: "asc" } },
        cohortMembers: { include: { profile: true }, orderBy: { role: "asc" } },
      },
    });

    return ApiResponse.success(res, server);
  } catch (error) {
    logger.error("[UPDATE_CHANNEL]", error);
    return ApiResponse.error(res, "Internal server error");
  }
};

/**
 * Delete a channel
 */
export const deleteChannel = async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;
    const { cohortId } = req.query;
    const userId = res.locals.userId;

    if (!cohortId || typeof cohortId !== "string") {
      return ApiResponse.error(res, "Cohort ID missing", 400);
    }

    if (!channelId) {
      return ApiResponse.error(res, "Channel ID missing", 400);
    }

    const currentMember = await prisma.cohortMember.findFirst({
      where: {
        cohortId,
        profile: { userId },
        role: { in: ["ADMIN", "MODERATOR"] },
      },
    });

    if (!currentMember) {
      return ApiResponse.error(res, "Forbidden", 403);
    }

    const channel = await prisma.channel.findFirst({
      where: { id: channelId, cohortId },
    });

    if (!channel) {
      return ApiResponse.error(res, "Channel not found", 404);
    }

    if (channel.name === "general") {
      return ApiResponse.error(res, "Cannot delete general channel", 400);
    }

    const server = await prisma.cohort.update({
      where: { id: cohortId },
      data: {
        channels: {
          delete: { id: channelId },
        },
      },
      include: {
        channels: { orderBy: { createdAt: "asc" } },
        cohortMembers: { include: { profile: true }, orderBy: { role: "asc" } },
      },
    });

    return ApiResponse.success(res, server);
  } catch (error) {
    logger.error("[DELETE_CHANNEL]", error);
    return ApiResponse.error(res, "Internal server error");
  }
};

/**
 * Update cohortMember role
 */
export const updateMemberRole = async (req: Request, res: Response) => {
  try {
    const { cohortMemberId } = req.params;
    const { cohortId } = req.query;
    const { role } = req.body;
    const userId = res.locals.userId;

    if (!cohortId || typeof cohortId !== "string") {
      return ApiResponse.error(res, "Cohort ID missing", 400);
    }

    if (!cohortMemberId) {
      return ApiResponse.error(res, "CohortMember ID missing", 400);
    }

    const currentMember = await prisma.cohortMember.findFirst({
      where: {
        cohortId,
        profile: { userId },
        role: "ADMIN",
      },
    });

    if (!currentMember) {
      return ApiResponse.error(res, "Forbidden", 403);
    }

    const server = await prisma.cohort.update({
      where: { id: cohortId },
      data: {
        cohortMembers: {
          update: {
            where: { id: cohortMemberId },
            data: { role },
          },
        },
      },
      include: {
        channels: { orderBy: { createdAt: "asc" } },
        cohortMembers: { include: { profile: true }, orderBy: { role: "asc" } },
      },
    });

    return ApiResponse.success(res, server);
  } catch (error) {
    logger.error("[UPDATE_MEMBER_ROLE]", error);
    return ApiResponse.error(res, "Internal server error");
  }
};

/**
 * Kick cohortMember from server
 */
export const kickMember = async (req: Request, res: Response) => {
  try {
    const { cohortMemberId } = req.params;
    const { cohortId } = req.query;
    const userId = res.locals.userId;

    if (!cohortId || typeof cohortId !== "string") {
      return ApiResponse.error(res, "Cohort ID missing", 400);
    }

    if (!cohortMemberId) {
      return ApiResponse.error(res, "CohortMember ID missing", 400);
    }

    const currentMember = await prisma.cohortMember.findFirst({
      where: {
        cohortId,
        profile: { userId },
        role: "ADMIN",
      },
    });

    if (!currentMember) {
      return ApiResponse.error(res, "Forbidden", 403);
    }

    const server = await prisma.cohort.update({
      where: { id: cohortId },
      data: {
        cohortMembers: {
          delete: { id: cohortMemberId },
        },
      },
      include: {
        channels: { orderBy: { createdAt: "asc" } },
        cohortMembers: { include: { profile: true }, orderBy: { role: "asc" } },
      },
    });

    return ApiResponse.success(res, server);
  } catch (error) {
    logger.error("[KICK_MEMBER]", error);
    return ApiResponse.error(res, "Internal server error");
  }
};
