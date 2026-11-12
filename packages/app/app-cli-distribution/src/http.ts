import { ProtocolError } from '@nocobase/agent-protocol';
import { ApiError, apiErrorHandler } from '@nocobase/app-server/router';
import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
export function distributionRouter(): Hono {
  const router = new Hono();
  router.onError((error, context) =>
    apiErrorHandler(
      error instanceof ProtocolError
        ? new ApiError({
            status: error.apiStatus,
            reason: error.code,
            domain: error.domain,
            message: error.message,
            ...(error.details ? { metadata: error.details } : {}),
            httpStatus: error.status as ContentfulStatusCode,
            cause: error,
          })
        : error,
      context,
    ),
  );
  return router;
}
