import { Router } from "express";
import * as controllers from "./controllers";
import validator from "@/shared/middlewares/validationMiddleware";
import {
  createChannelSchema,
  updateChannelSchema,
  deleteChannelSchema,
  getChannelSchema,
  getCohortChannelsSchema,
  updateMemberRoleSchema,
  kickMemberSchema,
  getCohortMembersSchema,
  getMemberSchema,
} from "@/shared/schemas/cohort.schema";

const router = Router();

// Channels
const channelRouter = Router();
channelRouter.get(
  "/cohort/:cohortId",
  validator(getCohortChannelsSchema),
  controllers.getServerChannels,
);
channelRouter.get(
  "/:channelId",
  validator(getChannelSchema),
  controllers.getChannel,
);
channelRouter.post(
  "/",
  validator(createChannelSchema),
  controllers.createChannel,
);
channelRouter.patch(
  "/:channelId",
  validator(updateChannelSchema),
  controllers.updateChannel,
);
channelRouter.delete(
  "/:channelId",
  validator(deleteChannelSchema),
  controllers.deleteChannel,
);

// Members
const memberRouter = Router();
memberRouter.get(
  "/cohort/:cohortId",
  validator(getCohortMembersSchema),
  controllers.getServerMembers,
);
memberRouter.get(
  "/:cohortMemberId",
  validator(getMemberSchema),
  controllers.getMember,
);
memberRouter.patch(
  "/:cohortMemberId",
  validator(updateMemberRoleSchema),
  controllers.updateMemberRole,
);
memberRouter.delete(
  "/:cohortMemberId",
  validator(kickMemberSchema),
  controllers.kickMember,
);

// Mount routes
router.use("/channels", channelRouter);
router.use("/cohort-members", memberRouter);

export default router;
