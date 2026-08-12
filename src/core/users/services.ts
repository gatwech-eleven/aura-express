import { prisma } from "@/shared/core/db";
import logger from "@/shared/core/logger";

/**
 * Get profile by userId
 */
export const getProfileByUserId = async (userId: string) => {
  return await prisma.profile.findFirst({
    where: { userId },
  });
};

/**
 * Get profile with servers
 */
export const getProfileWithServers = async (userId: string) => {
  return await prisma.profile.findFirst({
    where: { userId },
    include: {
      cohortMembers: {
        include: {
          cohort: true,
        },
      },
    },
  });
};

/**
 * Update user status and return all online users
 */
export const updateProfile = async (
  userId: string,
  data: {
    name?: string;
    imageUrl?: string;
    publicKey?: string;
    encryptedPrivateKey?: string;
    privateKeyIv?: string;
    privateKeySalt?: string;
    bio?: string;
  },
) => {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        image: data.imageUrl,
      },
    });

    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: {
        name: data.name,
        imageUrl: data.imageUrl,
        publicKey: data.publicKey,
        encryptedPrivateKey: data.encryptedPrivateKey,
        privateKeyIv: data.privateKeyIv,
        privateKeySalt: data.privateKeySalt,
        bio: data.bio,
      },
    });

    return { user: updatedUser, profile: updatedProfile };
  } catch (error) {
    logger.error("[UPDATE_PROFILE_SERVICE]", error);
    throw error;
  }
};

/**
 * Update user status and return all online users
 */
export const updateUserStatus = async (userId: string, status: boolean) => {
  try {
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isOnline: status,
      },
    });

    const onlineUsers = await prisma.user.findMany({
      where: {
        isOnline: true,
      },
    });

    return onlineUsers;
  } catch (error) {
    logger.error("[UPDATE_USER_STATUS]", error);
    throw error;
  }
};
