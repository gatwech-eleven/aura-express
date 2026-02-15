import { Request, Response } from "express";
import { prisma } from "@/shared/core/db";
import { ApiResponse } from "@/shared/utils/api-response";
import logger from "@/shared/core/logger";
import { MessageService, findOrCreateConversation } from "../services";

/**
 * Get a conversation between two users
 */
export const getConversation = async (req: Request, res: Response) => {
  const { receiverId } = req.query;
  try {
    const conversation = await findOrCreateConversation(
      res.locals.userId,
      receiverId as string,
    );
    return ApiResponse.success(res, conversation);
  } catch (err: any) {
    logger.error(err);
    return ApiResponse.error(res, err.message);
  }
};

/**
 * Send a message (Legacy/Shortcut)
 */
export const sendMessageController = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const { receiverId } = req.query;
    const userId = res.locals.userId;

    const conversation = await findOrCreateConversation(
      userId,
      receiverId as string,
    );
    if (!conversation)
      return ApiResponse.error(res, "Conversation not found", 404);

    const result = await MessageService.createDirectMessage({
      content: message,
      conversationId: conversation.id,
      userId,
    });

    return ApiResponse.success(res, result, "Message sent", 201);
  } catch (error: any) {
    logger.error(error);
    return ApiResponse.error(res, error.message || "Internal server error");
  }
};

/**
 * Get all active conversations for the current user
 */
export const getConversations = async (req: Request, res: Response) => {
  try {
    const { cohortId } = req.query;
    const userId = res.locals.userId;

    const profile = await prisma.profile.findFirst({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        userId: true,
        cohortMembers: cohortId
          ? {
              where: { cohortId: cohortId as string },
              select: { id: true, cohortId: true },
            }
          : {
              select: { id: true, cohortId: true },
            },
      },
    });

    if (!profile) {
      logger.warn(
        `[ConversationController] No profile found for userId=${userId}`,
      );
      return ApiResponse.error(res, "Profile not found", 404);
    }

    let memberIds: string[] = [];

    if (cohortId) {
      const currentMember = profile.cohortMembers.find(
        (m) => m.cohortId === (cohortId as string),
      );

      if (!currentMember) {
        return ApiResponse.error(
          res,
          "CohortMember not found in this server",
          404,
        );
      }
      memberIds = [currentMember.id];
    } else {
      memberIds = profile.cohortMembers.map((m) => m.id);
    }

    if (memberIds.length === 0) {
      return ApiResponse.success(res, {
        conversations: [],
        currentMemberId: null,
      });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { cohortMemberOneId: { in: memberIds } },
          { cohortMemberTwoId: { in: memberIds } },
        ],
      },
      include: {
        cohortMemberOne: {
          include: {
            profile: true,
            cohort: true,
          },
        },
        cohortMemberTwo: {
          include: {
            profile: true,
            cohort: true,
          },
        },
        directMessages: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    const activeConversations = conversations
      .filter((conv) => conv.directMessages.length > 0)
      .sort((a, b) => {
        const aTime = a.directMessages[0]?.createdAt.getTime() || 0;
        const bTime = b.directMessages[0]?.createdAt.getTime() || 0;
        return bTime - aTime;
      });

    return ApiResponse.success(res, {
      conversations: activeConversations,
      currentMemberIds: memberIds,
    });
  } catch (error) {
    logger.error("[GET_CONVERSATIONS]", error);
    return ApiResponse.error(res, "Internal server error");
  }
};
