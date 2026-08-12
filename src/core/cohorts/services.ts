import { prisma } from "@/shared/core/db";

/**
 * Service for handling cohortMember-related logic
 */
export class MemberService {
  /**
   * Resolve a cohortMember from a userId and context
   */
  public static async resolveMember(
    userId: string,
    context: { cohortId?: string; conversationId?: string },
  ) {
    const { cohortId, conversationId } = context;

    if (cohortId) {
      return await prisma.cohortMember.findFirst({
        where: {
          cohortId,
          profile: { userId },
        },
        include: { profile: true },
      });
    }

    if (conversationId) {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          cohortMemberOne: { include: { profile: true } },
          cohortMemberTwo: { include: { profile: true } },
        },
      });

      if (!conversation) return null;

      if (conversation.cohortMemberOne.profile.userId === userId) {
        return conversation.cohortMemberOne;
      }
      if (conversation.cohortMemberTwo.profile.userId === userId) {
        return conversation.cohortMemberTwo;
      }
    }

    return null;
  }
}
