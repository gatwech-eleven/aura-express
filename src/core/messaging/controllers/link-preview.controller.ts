import axios from "axios";
import { Request, Response } from "express";

import logger from "@/shared/core/logger";
import { ApiResponse } from "@/shared/utils/api-response";
/**
 * Get link preview for a URL
 */
export const getLinkPreview = async (req: Request, res: Response) => {
  const { url } = req.query;
  try {
    if (!url || typeof url !== "string") {
      return ApiResponse.error(res, "URL is required", 400);
    }

    const apiKey = process.env.OPENGRAPH_IO_KEY;

    if (!apiKey) {
      logger.error("[LinkPreview] OPENGRAPH_IO_KEY is missing");
      return ApiResponse.error(
        res,
        "Link preview service is not configured.",
        500,
      );
    }

    const opengraphUrl = `https://opengraph.io/api/1.1/site/${encodeURIComponent(url)}?app_id=${apiKey}`;
    const response = await axios.get(opengraphUrl, { timeout: 10000 });
    const data = response.data;

    if (data.error) {
      return ApiResponse.error(res, data.error.message, 400);
    }

    const hybrid = data.hybridGraph || {};
    const openGraph = data.openGraph || {};
    const htmlInferred = data.htmlInferred || {};

    let fallbackTitle = url;
    try {
      fallbackTitle = new URL(url).hostname;
    } catch (e) {
      /* Ignore */
    }

    return ApiResponse.success(
      res,
      {
        title:
          hybrid.title ||
          openGraph.title ||
          htmlInferred.title ||
          fallbackTitle,
        description:
          hybrid.description ||
          openGraph.description ||
          htmlInferred.description ||
          "",
        image: hybrid.image || openGraph.image || htmlInferred.image || null,
        favIcon: data.favicon || null,
        url: data.url || url,
      },
      "Link preview fetched",
    );
  } catch (error: any) {
    const status = error.response?.status || 500;
    const errorMessage =
      error.response?.data?.error?.message ||
      error.message ||
      "Failed to fetch link preview";

    logger.error(
      `[LinkPreview] Error fetching metadata for ${url}: ${errorMessage} (Status: ${status})`,
    );

    return ApiResponse.error(res, errorMessage, status);
  }
};
