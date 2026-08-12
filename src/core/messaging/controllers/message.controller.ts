import { Request, Response } from "express";
import { prisma } from "@/shared/core/db";
import { ApiResponse } from "@/shared/utils/api-response";
import logger from "@/shared/core/logger";
import { MessageService } from "../services";
import { PinService } from "../pin.service";
import { events, MESSAGE_EVENTS } from "@/shared/core/events";

/**
 * Create a channel message
 */
export const createChannelMessage = async (req: Request, res: Response) => {
  try {
    const { content, fileUrl, isEncrypted, parentId, poll } = req.body;
    const { cohortId, channelId } = req.query;
    const userId = res.locals.userId;

    if (!cohortId || !channelId) {
      return ApiResponse.error(res, "Cohort ID or Channel ID missing", 400);
    }

    console.time(`[CREATE_CHANNEL_MESSAGE] Total: ${userId}`);
    const message = await MessageService.createChannelMessage({
      content,
      fileUrl,
      isEncrypted,
      parentId,
      cohortId: cohortId as string,
      channelId: channelId as string,
      userId,
      poll,
    });
    console.timeEnd(`[CREATE_CHANNEL_MESSAGE] Total: ${userId}`);

    return ApiResponse.success(res, message, "Message created", 201);
  } catch (error: any) {
    logger.error("[CREATE_CHANNEL_MESSAGE]", error);
    const status =
      error.message === "CohortMember not found in this server" ? 404 : 500;
    return ApiResponse.error(
      res,
      error.message || "Internal server error",
      status,
    );
  }
};

/**
 * Create a direct message
 */
export const createDirectMessage = async (req: Request, res: Response) => {
  try {
    const { content, fileUrl, isEncrypted, parentId, poll } = req.body;
    const { conversationId } = req.query;
    const userId = res.locals.userId;

    if (!conversationId) {
      return ApiResponse.error(res, "Conversation ID missing", 400);
    }

    const message = await MessageService.createDirectMessage({
      content,
      fileUrl,
      isEncrypted,
      parentId,
      conversationId: conversationId as string,
      userId,
      poll,
    });

    return ApiResponse.success(res, message, "Direct message created", 201);
  } catch (error: any) {
    logger.error("[CREATE_DIRECT_MESSAGE]", error);
    const status =
      error.message === "CohortMember not found in conversation" ? 404 : 500;
    return ApiResponse.error(
      res,
      error.message || "Internal server error",
      status,
    );
  }
};

/**
 * Update a message
 */
export const updateMessage = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const { cohortId, conversationId } = req.query;
    const userId = res.locals.userId;

    if (!content) {
      return ApiResponse.error(res, "Content missing", 400);
    }

    const updatedMessage = await MessageService.updateMessage({
      messageId,
      content,
      userId,
      cohortId: cohortId as string,
      conversationId: conversationId as string,
    });

    return ApiResponse.success(res, updatedMessage, "Message updated");
  } catch (error: any) {
    logger.error("[UPDATE_MESSAGE]", error);
    return ApiResponse.error(res, error.message || "Internal server error");
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const { cohortId, conversationId } = req.query;
    const userId = res.locals.userId;

    const deletedMessage = await MessageService.deleteMessage({
      messageId,
      userId,
      cohortId: cohortId as string,
      conversationId: conversationId as string,
    });

    return ApiResponse.success(res, deletedMessage, "Message deleted");
  } catch (error: any) {
    logger.error("[DELETE_MESSAGE]", error);
    return ApiResponse.error(res, error.message || "Internal server error");
  }
};

/**
 * Get messages for a channel
 */
export const getMessages = async (req: Request, res: Response) => {
  const { channelId, cursor } = req.query;
  // const MESSAGES_BATCH = 10;
  const MESSAGES_BATCH = 10;

  try {
    if (!channelId) {
      return ApiResponse.error(res, "Channel ID required", 400);
    }

    const messages = await prisma.message.findMany({
      take: MESSAGES_BATCH,
      ...(cursor && { skip: 1, cursor: { id: cursor as string } }),
      where: { channelId: channelId as string },
      include: {
        cohortMember: { include: { profile: true } },
        poll: {
          include: {
            options: {
              include: {
                votes: true,
                _count: { select: { votes: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let nextCursor = null;
    if (messages.length === MESSAGES_BATCH) {
      nextCursor = messages[MESSAGES_BATCH - 1].id;
    }

    return ApiResponse.success(res, {
      items: messages,
      nextCursor,
    });
  } catch (error) {
    logger.error("[GET_MESSAGES]", error);
    return ApiResponse.error(res, "Internal server error");
  }
};

/**
 * Get direct messages by conversationId
 */
export const getDirectMessages = async (req: Request, res: Response) => {
  const { conversationId, cursor } = req.query;
  // const MESSAGES_BATCH = 10;
  const MESSAGES_BATCH = 10;

  try {
    if (!conversationId) {
      return ApiResponse.error(res, "Conversation ID missing", 400);
    }

    const messages = await prisma.directMessage.findMany({
      take: MESSAGES_BATCH,
      ...(cursor && { skip: 1, cursor: { id: cursor as string } }),
      where: {
        conversationId: conversationId as string,
      },
      include: {
        cohortMember: {
          include: {
            profile: true,
          },
        },
        poll: {
          include: {
            options: {
              include: {
                votes: true,
                _count: { select: { votes: true } },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let nextCursor = null;

    if (messages.length === MESSAGES_BATCH) {
      nextCursor = messages[MESSAGES_BATCH - 1].id;
    }

    return ApiResponse.success(res, {
      items: messages,
      nextCursor,
    });
  } catch (error) {
    logger.error("[GET_DIRECT_MESSAGES]", error);
    return ApiResponse.error(res, "Internal Error", 500);
  }
};

/**
 * Pin a message
 */
export const pinMessage = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const { cohortId, conversationId } = req.query;
    const userId = res.locals.userId;

    const message = await PinService.pinMessage({
      messageId,
      userId,
      cohortId: cohortId as string,
      conversationId: conversationId as string,
    });

    events.emit(MESSAGE_EVENTS.UPDATED, {
      message,
      type: cohortId ? "channel" : "direct",
      contextId: cohortId
        ? (message as any).channelId
        : (message as any).conversationId,
    });

    return ApiResponse.success(res, message, "Message pinned");
  } catch (error: any) {
    logger.error("[PIN_MESSAGE]", error);
    return ApiResponse.error(res, error.message || "Internal server error");
  }
};

/**
 * Unpin a message
 */
export const unpinMessage = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const { cohortId, conversationId } = req.query;
    const userId = res.locals.userId;

    const message = await PinService.unpinMessage({
      messageId,
      userId,
      cohortId: cohortId as string,
      conversationId: conversationId as string,
    });

    events.emit(MESSAGE_EVENTS.UPDATED, {
      message,
      type: cohortId ? "channel" : "direct",
      contextId: cohortId
        ? (message as any).channelId
        : (message as any).conversationId,
    });

    return ApiResponse.success(res, message, "Message unpinned");
  } catch (error: any) {
    logger.error("[UNPIN_MESSAGE]", error);
    return ApiResponse.error(res, error.message || "Internal server error");
  }
};
