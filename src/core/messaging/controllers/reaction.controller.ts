import { Request, Response } from "express";
import { prisma } from "@/shared/core/db";
import { ApiResponse } from "@/shared/utils/api-response";
import logger from "@/shared/core/logger";

// ReactionService use lazy loading to avoid circular dependencies if any
const getReactionService = () => {
  const { ReactionService: RealReactionService } = require("../services");
  return RealReactionService;
};

/**
 * Add emoji reaction to message
 */
export const addReaction = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.userId;
    if (!userId) return ApiResponse.error(res, "Unauthorized", 401);

    const { emoji, messageId, directMessageId } = req.body;

    if (!emoji || (!messageId && !directMessageId)) {
      return ApiResponse.error(res, "Missing required fields", 400);
    }

    const reactionService = getReactionService();
    const reaction = await reactionService.addReaction({
      userId,
      emoji,
      messageId,
      directMessageId,
    });

    return ApiResponse.success(res, reaction, "Reaction added");
  } catch (error: any) {
    logger.error("[ADD_REACTION]", error);
    const status = error.message === "Profile not found" ? 404 : 500;
    return ApiResponse.error(
      res,
      error.message || "Internal server error",
      status,
    );
  }
};

/**
 * Remove reaction
 */
export const removeReaction = async (req: Request, res: Response) => {
  try {
    const { reactionId } = req.params;
    const userId = res.locals.userId;
    if (!userId) return ApiResponse.error(res, "Unauthorized", 401);

    const reactionService = getReactionService();
    await reactionService.removeReaction({
      userId,
      reactionId,
    });

    return ApiResponse.success(res, { success: true }, "Reaction removed");
  } catch (error: any) {
    logger.error("[REMOVE_REACTION]", error);
    const status = error.message === "Profile not found" ? 404 : 500;
    return ApiResponse.error(
      res,
      error.message || "Internal server error",
      status,
    );
  }
};

/**
 * Get all reactions for a message
 */
export const getMessageReactions = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const { type } = req.query; // "channel" or "direct"

    const reactions = await prisma.reaction.findMany({
      where: type === "direct" ? { directMessageId: messageId } : { messageId },
      include: {
        profile: {
          select: { id: true, name: true, imageUrl: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const groupedReactions = reactions.reduce(
      (acc, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = [];
        }
        acc[reaction.emoji].push(reaction);
        return acc;
      },
      {} as Record<string, typeof reactions>,
    );

    return ApiResponse.success(res, groupedReactions);
  } catch (error) {
    logger.error("[GET_MESSAGE_REACTIONS]", error);
    return ApiResponse.error(res, "Internal server error");
  }
};
