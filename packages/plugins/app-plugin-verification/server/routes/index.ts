import {
  authenticationToken,
  isServiceAccount,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponse,
  apiValidator,
  cliRoute,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  getClientAddress,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono, type MiddlewareHandler } from 'hono';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';

import { verificationError } from '../services/verification.js';
import { verificationServiceToken } from '../tokens.js';
import {
  phoneInput,
  phoneSchema,
  sendInput,
  stepUpInput,
  stepUpSchema,
  timingSchema,
} from './schemas.js';

const tags = ['Verification'];
const sessionSecurity = [{ cookieAuth: [] }];
const sessionErrors = {
  401: apiErrorResponse(401),
  403: apiErrorResponse(403),
  500: apiErrorResponse(500),
};

const verificationRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes<AppPluginApplication>(({ container }) => {
    const router = new Hono<AuthEnv>();
    const auth = container.resolve(authenticationToken);
    const service = () => container.resolve(verificationServiceToken);

    router.onError((error, context) => {
      if (
        error instanceof ApiError &&
        error.domain === 'verification' &&
        error.code === 429
      ) {
        context.header(
          'Retry-After',
          String(error.metadata?.retryAfterSeconds),
        );
      }
      return apiErrorHandler(error, context);
    });
    router.use('/verification/*', async (context, next) => {
      context.header('Cache-Control', 'no-store');
      await next();
    });
    const personOnly: MiddlewareHandler<AuthEnv> = async (context, next) => {
      const session = context.get('auth');
      if (
        session &&
        (isServiceAccount(session.user) ||
          (await auth.isScopedSession(session, context.req.raw)))
      ) {
        throw verificationError(
          'PERMISSION_DENIED',
          'VERIFICATION_SESSION_REQUIRED',
          'A signed-in person is required.',
        );
      }
      await next();
    };

    router.post(
      '/verification/codes/send',
      auth.optional(),
      personOnly,
      describeRoute({
        tags,
        summary: 'Request a verification code',
        operationId: 'verificationSendCode',
        description:
          'Public scenes are anonymous and rate limited. Signed-in scenes act on the current person. The stepUp scene sends to their verified phone for the supplied purpose. HTTP 429 includes Retry-After and error.metadata.retryAt.',
        security: [],
        ...cliRoute({ action: 'verification.codes/send', hidden: true }),
        responses: {
          200: dataResponse(timingSchema),
          ...sessionErrors,
          429: apiErrorResponse(429),
          503: apiErrorResponse(503),
        },
      }),
      apiValidator('json', sendInput),
      async (context) => {
        const { phone, ...input } = context.req.valid('json');
        return context.json({
          data: await service().send({
            ...input,
            target: phone,
            userId: context.get('auth')?.user.id,
            clientAddress: getClientAddress(context),
          }),
        });
      },
    );

    router.post(
      '/verification/stepUpTokens',
      auth.required(),
      personOnly,
      describeRoute({
        tags,
        summary: 'Exchange a code for a step-up credential',
        operationId: 'verificationIssueStepUpToken',
        description:
          'Requires the current person’s session and the code sent to their verified phone for this purpose. The credential is returned once.',
        security: sessionSecurity,
        ...cliRoute({
          action: 'verification.stepUpTokens/create',
          hidden: true,
        }),
        responses: {
          200: dataResponse(stepUpSchema),
          ...sessionErrors,
          503: apiErrorResponse(503),
        },
      }),
      apiValidator('json', stepUpInput),
      async (context) =>
        context.json({
          data: await service().issueStepUp({
            ...context.req.valid('json'),
            userId: context.get('auth')!.user.id,
          }),
        }),
    );

    router.get(
      '/verification/me/phone',
      auth.required(),
      personOnly,
      describeRoute({
        tags,
        summary: 'Get my verified phone',
        operationId: 'verificationGetMyPhone',
        description:
          'Requires the current person’s session. The reply gives only the last four digits.',
        security: sessionSecurity,
        ...cliRoute({ action: 'verification.phone/read', hidden: true }),
        responses: { 200: dataResponse(phoneSchema), ...sessionErrors },
      }),
      async (context) =>
        context.json({
          data: await service().getPhone(context.get('auth')!.user.id),
        }),
    );

    router.put(
      '/verification/me/phone',
      auth.required(),
      personOnly,
      describeRoute({
        tags,
        summary: 'Bind or change my verified phone',
        operationId: 'verificationSetMyPhone',
        description:
          'Requires the current person’s session and a code sent to the new phone. To replace an existing verified phone, also supply a verification.changePhone credential in the X-Verification-Token header.',
        security: sessionSecurity,
        ...cliRoute({ action: 'verification.phone/update', hidden: true }),
        responses: {
          200: dataResponse(phoneSchema),
          ...sessionErrors,
          409: apiErrorResponse(409),
        },
      }),
      apiValidator('json', phoneInput),
      async (context) =>
        context.json({
          data: await service().bindPhone({
            ...context.req.valid('json'),
            userId: context.get('auth')!.user.id,
            token: context.req.header('X-Verification-Token'),
          }),
        }),
    );

    return new Hono().route('/', router);
  });

const routes: readonly AppApiRouteContribution<AppPluginApplication>[] = [
  verificationRoutes,
];

export default routes;
