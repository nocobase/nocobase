import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import type { Application } from '@nocobase/app-server/application';
import { loggingToken } from '@nocobase/app-server/logging';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponse,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';
import {
  StructuredExtractionService,
  type ExtractionResult,
} from '../providers/structured-extraction-service.js';
import { EXAMPLES_APP_DOMAIN, EXAMPLES_APP_TAGS as tags } from './domain.js';

// These schemas belong only to this computation, not to either frontend form.
const Input = z.strictObject({
  text: z.string().trim().min(1).max(20_000),
  model: z.strictObject({
    modelService: z.string().min(1),
    model: z.string().min(1),
  }),
  // Arbitrary caller-owned JSON Schema: retain every keyword for the native compiler.
  schema: z.unknown(),
});
const Result: z.ZodType<ExtractionResult> = z.record(z.string(), z.unknown());

/** All ordinary signed-in personal users may extract; no page or management grant is required. */
export const structuredExtractionRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes((app) => {
    const router = new Hono<AuthorizationEnv>();
    router.onError((error, context) =>
      apiErrorHandler(
        error instanceof ApiError &&
          error.reason === 'INVALID_INPUT' &&
          error.fieldViolations?.some((violation) => violation.field === 'text')
          ? new ApiError({
              status: 'INVALID_ARGUMENT',
              reason: 'INVALID_TEXT',
              domain: EXAMPLES_APP_DOMAIN,
              message:
                'Provide nonempty source text of at most 20,000 characters.',
              fieldViolations: error.fieldViolations,
            })
          : error,
        context,
      ),
    );
    const auth = app.container.resolve(authenticationToken);
    const authorization = app.container.resolve(authorizationToken);
    const agents = app.container.resolve(agentsToken);
    const logger = app.container.has(loggingToken)
      ? app.container.resolve(loggingToken).getLogger()
      : undefined;
    const service = new StructuredExtractionService({
      onlineAgent: agents.onlineAgent,
      catalog: () => agents.models.gateway.catalog('chat'),
      onError: (error) =>
        logger?.error({ err: error }, 'Structured extraction failed.'),
    });
    router.post(
      '/aiStructuredExtraction',
      // Default required() deliberately refuses restricted/scoped keys and service accounts.
      // Authorization supplies trusted identity, not a new management permission for this demo.
      auth.required(),
      authorization.middleware(),
      describeRoute({
        tags,
        summary: 'Extract structured information from text',
        operationId: 'examplesExtractStructuredInformation',
        description:
          'Available to all ordinary signed-in personal users without a management grant. ' +
          'Scoped or restricted credentials and service accounts are refused. The schema must have an object root; ' +
          'native OnlineAgent validates it and persists the result. Only the successful structured object is returned. ' +
          'The deadline is 60 seconds with at most 2 seconds of cancellation cleanup; cancellation is best effort. ' +
          'Do not automatically retry a timeout because the outcome is unknown.',
        responses: {
          200: dataResponse(Result),
          401: apiErrorResponse(401),
          403: apiErrorResponse(403),
          413: apiErrorResponse(413),
          500: apiErrorResponse(500),
          503: apiErrorResponse(503),
          504: apiErrorResponse(504),
        },
      }),
      bodyLimit({
        maxSize: 128 * 1024,
        onError: () => {
          throw new ApiError({
            status: 'INVALID_ARGUMENT',
            reason: 'BODY_TOO_LARGE',
            domain: EXAMPLES_APP_DOMAIN,
            message: 'The request body exceeds 128 KiB.',
            httpStatus: 413,
          });
        },
      }),
      apiValidator('json', Input),
      async (c) => {
        const auth = c.get('auth')!;
        return c.json({
          data: await service.extract(
            {
              user: { id: auth.user.id },
              authorization: c.get('authz'),
              credentials: auth,
            },
            c.req.valid('json'),
            c.req.raw.signal,
          ),
        });
      },
    );
    return new Hono().route('/', router);
  });
