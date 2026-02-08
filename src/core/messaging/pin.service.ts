import { prisma } from "@/shared/core/db";
import { MemberService } from "@/core/cohorts/services";
import {
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} from "@/shared/utils/errors";

export class PinService {
  /**
   * Pin a message
   */
  public static async pinMessage(payload: {
    messageId: string;
    userId: string;
    cohortId?: string;
    conversationId?: string;
  }) {
    return this.setPinStatus({ ...payload, isPinned: true });
  }

  /**
   * Unpin a message
   */
  public static async unpinMessage(payload: {
    messageId: string;
    userId: string;
    cohortId?: string;
    conversationId?: string;
  }) {
    return this.setPinStatus({ ...payload, isPinned: false });
  }

  /**
   * Shared logic for pinning/unpinning (DRY)
   */
  private static async setPinStatus(payload: {
    messageId: string;
    userId: string;
    isPinned: boolean;
    cohortId?: string;
    conversationId?: string;
  }) {
    const { messageId, userId, isPinned, cohortId, conversationId } = payload;

    const cohortMember = await MemberService.resolveMember(userId, {
      cohortId,
      conversationId,
    });

    if (!cohortMember) throw new UnauthorizedError("CohortMember not found");

    if (cohortId) {
      // In servers, only Admin/Moderator can pin
      if (!["ADMIN", "MODERATOR"].includes(cohortMember.role)) {
        throw new UnauthorizedError(
          "Insufficient permissions to manage pinned messages",
        );
      }

      const message = await prisma.message.findFirst({
        where: { id: messageId, channel: { cohortId } },
      });

      if (!message) throw new NotFoundError("Message not found in this server");

      return await prisma.message.update({
        where: { id: messageId },
        data: { isPinned },
        include: { cohortMember: { include: { profile: true } } },
      });
    } else if (conversationId) {
      // In DMs, either participant can pin
      const message = await prisma.directMessage.findFirst({
        where: { id: messageId, conversationId },
      });

      if (!message)
        throw new NotFoundError("Message not found in this conversation");

      return await prisma.directMessage.update({
        where: { id: messageId },
        data: { isPinned },
        include: { cohortMember: { include: { profile: true } } },
      });
    }

    throw new BadRequestError(
      "Context missing (cohortId or conversationId required)",
    );
  }
}
