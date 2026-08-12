import { Request, Response } from "express";

import { prisma } from "@/shared/core/db";
import logger from "@/shared/core/logger";
import { ApiResponse } from "@/shared/utils/api-response";

/**
 * Get thread metadata for a channel message
 */
export const getChannelThreadMetadata = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;

    if (!messageId) {
      return ApiResponse.error(res, "Message ID missing", 400);
    }

    const replies = await prisma.message.findMany({
      where: {
        parentId: messageId,
        deleted: false,
      },
      include: {
        cohortMember: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const participantsMap = new Map();

    replies.forEach((reply) => {
      if (!participantsMap.has(reply.cohortMember.profile.id)) {
        participantsMap.set(reply.cohortMember.profile.id, {
          id: reply.cohortMember.profile.id,
          name: reply.cohortMember.profile.name,
          imageUrl: reply.cohortMember.profile.imageUrl,
        });
      }
    });

    const participants = Array.from(participantsMap.values());
    const lastReplyAt = replies.length > 0 ? replies[0].createdAt : null;

    return ApiResponse.success(res, {
      replyCount: replies.length,
      participants,
      lastReplyAt,
    });
  } catch (error) {
    logger.error("[GET_CHANNEL_THREAD_METADATA]", error);
    return ApiResponse.error(res, "Internal server error");
  }
};

/**
 * Get thread metadata for a direct message
 */
export const getDirectThreadMetadata = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;

    if (!messageId) {
      return ApiResponse.error(res, "Message ID missing", 400);
    }

    const replies = await prisma.directMessage.findMany({
      where: {
        parentId: messageId,
        deleted: false,
      },
      include: {
        cohortMember: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const participantsMap = new Map();

    replies.forEach((reply) => {
      if (!participantsMap.has(reply.cohortMember.profile.id)) {
        participantsMap.set(reply.cohortMember.profile.id, {
          id: reply.cohortMember.profile.id,
          name: reply.cohortMember.profile.name,
          imageUrl: reply.cohortMember.profile.imageUrl,
        });
      }
    });

    const participants = Array.from(participantsMap.values());
    const lastReplyAt = replies.length > 0 ? replies[0].createdAt : null;

    return ApiResponse.success(res, {
      replyCount: replies.length,
      participants,
      lastReplyAt,
    });
  } catch (error) {
    logger.error("[GET_DIRECT_THREAD_METADATA]", error);
    return ApiResponse.error(res, "Internal server error");
  }
};
