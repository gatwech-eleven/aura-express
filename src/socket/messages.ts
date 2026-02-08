import { Server } from "socket.io";
import { CustomSocket } from "@/shared/types";
import { prisma } from "@/shared/core/db";
import logger from "@/shared/core/logger";
import { findOrCreateConversation } from "@/core/messaging/services";

/**
 * Register message-related socket event handlers
 */
export const registerMessageHandlers = (io: Server, socket: CustomSocket) => {
  // Private message handler
  socket.on("private message", async ({ content, to }) => {
    io.to(to)
      .to(socket.user.id)
      .emit("private message", {
        ...content,
        from: socket.user,
        to,
      });

    logger.info(`[Socket] Private message from ${socket.user.id} to ${to}`);

    // Save message to database
    try {
      const conversation = await findOrCreateConversation(socket.user.id, to);
      if (!conversation) return;

      const cohortMember =
        conversation.cohortMemberOne.profileId === socket.user.id
          ? conversation.cohortMemberOne
          : conversation.cohortMemberTwo;

      await prisma.directMessage.create({
        data: {
          content: content.content || content,
          conversationId: conversation.id,
          cohortMemberId: cohortMember.id,
        },
      });
    } catch (err) {
      logger.error("[Socket] Error saving private message:", err);
    }
  });

  // Mark messages as read
  socket.on("markAsRead", async ({ senderId }) => {
    try {
      const receiverId = socket.user.id;

      await prisma.directMessage.updateMany({
        where: {
          cohortMember: {
            profileId: senderId,
          },
          conversation: {
            OR: [
              { cohortMemberOneId: receiverId, cohortMemberTwoId: senderId },
              { cohortMemberOneId: senderId, cohortMemberTwoId: receiverId },
            ],
          },
          seen: false,
        },
        data: {
          seen: true,
        },
      });

      io.to(senderId).emit("markAsRead", { senderId, receiverId });
    } catch (error) {
      logger.error("[Socket] Error marking messages as read:", error);
    }
  });
};
