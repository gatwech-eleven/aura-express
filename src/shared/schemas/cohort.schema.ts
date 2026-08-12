import { z } from "zod";

/**
 * Schema for creating a channel
 */
export const createChannelSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, "Channel name is required")
      .max(50, "Channel name is too long")
      .regex(
        /^[a-z0-9-]+$/,
        "Channel name must be lowercase alphanumeric with hyphens",
      ),
    type: z.enum(["TEXT", "AUDIO", "VIDEO"]).default("TEXT"),
    cohortId: z.string().min(1, "Cohort ID is required"),
  }),
});

/**
 * Schema for updating a channel
 */
export const updateChannelSchema = z.object({
  params: z.object({
    channelId: z.string().min(1, "Channel ID is required"),
  }),
  body: z.object({
    name: z
      .string()
      .min(1, "Channel name is required")
      .max(50, "Channel name is too long")
      .regex(
        /^[a-z0-9-]+$/,
        "Channel name must be lowercase alphanumeric with hyphens",
      )
      .optional(),
    type: z.enum(["TEXT", "AUDIO", "VIDEO"]).optional(),
  }),
  query: z.object({
    cohortId: z.string().min(1, "Cohort ID is required"),
  }),
});

/**
 * Schema for deleting a channel
 */
export const deleteChannelSchema = z.object({
  params: z.object({
    channelId: z.string().min(1, "Channel ID is required"),
  }),
  query: z.object({
    cohortId: z.string().min(1, "Cohort ID is required"),
  }),
});

/**
 * Schema for getting a channel
 */
export const getChannelSchema = z.object({
  params: z.object({
    channelId: z.string().min(1, "Channel ID is required"),
  }),
});

/**
 * Schema for getting cohort channels
 */
export const getCohortChannelsSchema = z.object({
  params: z.object({
    cohortId: z.string().min(1, "Cohort ID is required"),
  }),
});

/**
 * Schema for updating member role
 */
export const updateMemberRoleSchema = z.object({
  params: z.object({
    cohortMemberId: z.string().min(1, "Cohort member ID is required"),
  }),
  body: z.object({
    role: z.enum(["ADMIN", "MODERATOR", "GUEST"]),
  }),
  query: z.object({
    cohortId: z.string().min(1, "Cohort ID is required"),
  }),
});

/**
 * Schema for kicking a member
 */
export const kickMemberSchema = z.object({
  params: z.object({
    cohortMemberId: z.string().min(1, "Cohort member ID is required"),
  }),
  query: z.object({
    cohortId: z.string().min(1, "Cohort ID is required"),
  }),
});

/**
 * Schema for getting cohort members
 */
export const getCohortMembersSchema = z.object({
  params: z.object({
    cohortId: z.string().min(1, "Cohort ID is required"),
  }),
});

/**
 * Schema for getting a specific member
 */
export const getMemberSchema = z.object({
  params: z.object({
    cohortMemberId: z.string().min(1, "Cohort member ID is required"),
  }),
});
