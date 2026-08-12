import {
  events,
  MESSAGE_EVENTS,
  REACTION_EVENTS,
  POLL_EVENTS,
} from "@/shared/core/events";
import { socketService } from "@/shared/core/socket";
import { NotificationService } from "@/core/notifications/services";
import { extractMentionedUserIds } from "@/shared/utils/mention-parser";
import { prisma } from "@/shared/core/db";
import logger from "@/shared/core/logger";

/**
 * Handle message created event
 */
events.on(MESSAGE_EVENTS.CREATED, async ({ message, type, contextId }) => {
  try {
    socketService.emitChatMessage(contextId, "messages", message);

    if (type === "channel") {
      const mentionedUserIds = extractMentionedUserIds(message.content);
      if (mentionedUserIds.length > 0) {
        const mentionedProfiles = await prisma.profile.findMany({
          where: { userId: { in: mentionedUserIds } },
        });

        const channel = await prisma.channel.findUnique({
          where: { id: message.channelId },
        });

        for (const profile of mentionedProfiles) {
          if (profile.id !== message.cohortMember.profileId) {
            await NotificationService.createNotification({
              type: "MENTION",
              content: `mentioned you in #${channel?.name || "channel"}`,
              senderId: message.cohortMember.profileId,
              receiverId: profile.id,
              messageId: message.id,
              channelId: message.channelId,
              cohortId: channel?.cohortId,
            });
          }
        }
      }
    }
  } catch (error) {
    logger.error("[MessageHandler] Error handling message:created", error);
  }
});

/**
 * Handle message updated event
 */
events.on(MESSAGE_EVENTS.UPDATED, async ({ message, type, contextId }) => {
  socketService.emitChatMessage(contextId, "messages:update", message);
});

/**
 * Handle reaction added event
 */
events.on(
  REACTION_EVENTS.ADDED,
  async ({ reaction, authorProfileId, authorUserId, senderProfileId }) => {
    const roomId = reaction.messageId || reaction.directMessageId;
    socketService.emit("reaction:added", reaction, roomId);

    // Send notification to author if not reacting to own message
    if (
      authorProfileId &&
      authorProfileId !== senderProfileId &&
      authorUserId
    ) {
      await NotificationService.createNotification({
        type: "REACTION",
        content: `reacted ${reaction.emoji} to your message`,
        senderId: senderProfileId,
        receiverId: authorProfileId,
        messageId: reaction.messageId || undefined,
      });
    }
  },
);

/**
 * Handle reaction removed event
 */
events.on(REACTION_EVENTS.REMOVED, async ({ reaction }) => {
  const roomId = reaction.messageId || reaction.directMessageId;
  socketService.emit("reaction:removed", { id: reaction.id }, roomId);
});

/**
 * Handle poll voted event
 */
events.on(POLL_EVENTS.VOTED, async ({ poll }) => {
  try {
    const isChannel = !!poll.messageId;
    const messageId = poll.messageId || poll.directMessageId;

    if (!messageId) return;

    let fullMessage;
    if (isChannel) {
      fullMessage = await prisma.message.findUnique({
        where: { id: messageId },
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
      });
    } else {
      fullMessage = await prisma.directMessage.findUnique({
        where: { id: messageId },
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
      });
    }

    if (fullMessage) {
      const contextId = isChannel
        ? (fullMessage as any).channelId
        : (fullMessage as any).conversationId;

      socketService.emitChatMessage(contextId, "messages:update", fullMessage);
    }
  } catch (error) {
    logger.error("[MessageHandler] Error handling poll:voted", error);
  }
});
