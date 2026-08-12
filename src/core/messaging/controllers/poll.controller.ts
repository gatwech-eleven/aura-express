import { Request, Response } from "express";
import { ApiResponse } from "@/shared/utils/api-response";
import logger from "@/shared/core/logger";
import { PollService } from "../poll.service";
import { events, POLL_EVENTS } from "@/shared/core/events";

/**
 * Cast a vote in a poll
 */
export const castPollVote = async (req: Request, res: Response) => {
  try {
    const { pollId } = req.params;
    const { optionId } = req.body;
    const userId = res.locals.userId;

    if (!optionId) {
      return ApiResponse.error(res, "Option ID missing", 400);
    }

    await PollService.castVote({
      pollId,
      userId,
      optionId,
    });

    const updatedPoll = await PollService.getPollResults(pollId);

    events.emit(POLL_EVENTS.VOTED, { poll: updatedPoll });

    return ApiResponse.success(res, updatedPoll, "Vote cast successfully");
  } catch (error: any) {
    logger.error("[CAST_POLL_VOTE]", error);
    return ApiResponse.error(res, error.message || "Internal server error");
  }
};
