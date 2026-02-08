import { Router } from "express";
import * as controllers from "./controllers";

const router = Router();

// --- Channels ---
const channelRouter = Router();
channelRouter.get("/cohort/:cohortId", controllers.getServerChannels);
channelRouter.get("/:channelId", controllers.getChannel);
channelRouter.post("/", controllers.createChannel);
channelRouter.patch("/:channelId", controllers.updateChannel);
channelRouter.delete("/:channelId", controllers.deleteChannel);

// --- Members ---
const memberRouter = Router();
memberRouter.get("/cohort/:cohortId", controllers.getServerMembers);
memberRouter.get("/:cohortMemberId", controllers.getMember);
memberRouter.patch("/:cohortMemberId", controllers.updateMemberRole);
memberRouter.delete("/:cohortMemberId", controllers.kickMember);

// Mount routes
router.use("/channels", channelRouter);
router.use("/cohort-members", memberRouter);

export default router;
