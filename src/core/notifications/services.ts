import { prisma } from "@/shared/core/db";
import { socketService } from "@/shared/core/socket";

/**
 * Service for handling notifications
 */
export class NotificationService {
  /**
   * Create a new notification
   */
  public static async createNotification(payload: {
    type: "MENTION" | "REACTION" | "REPLY" | "THREAD_REPLY";
    content: string;
    senderId: string;
    receiverId: string;
    messageId?: string;
    channelId?: string;
    cohortId?: string;
  }) {
    const {
      type,
      content,
      senderId,
      receiverId,
      messageId,
      channelId,
      cohortId,
    } = payload;

    const notification = await prisma.notification.create({
      data: {
        type,
        content,
        senderId,
        receiverId,
        messageId,
        channelId,
        cohortId,
      },
      include: {
        sender: true,
      },
    });

    // Emit live via socket
    socketService.emitNotification(receiverId, notification);

    return notification;
  }
}
