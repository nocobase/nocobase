import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
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
  apiErrorResponses,
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
  TRANSLATION_LANGUAGES,
  TRANSLATION_MAX_LENGTH,
  type TranslationInput,
  type TranslationResult,
} from '../../shared/ai-translation.js';
import {
  TranslationError,
  translateText,
} from '../providers/ai-translation.js';
import { EXAMPLES_APP_DOMAIN, EXAMPLES_APP_TAGS as tags } from './domain.js';

const Input = z.strictObject({
  text: z
    .string()
    .max(TRANSLATION_MAX_LENGTH)
    .refine((text) => text.trim().length > 0, 'Enter text to translate.')
    .meta({ description: 'Source text, preserving its original whitespace.' }),
  sourceLanguage: z
    .enum(['auto', ...TRANSLATION_LANGUAGES])
    .default('auto')
    .meta({ description: 'Source language, or auto for detection.' }),
  targetLanguage: z
    .enum(TRANSLATION_LANGUAGES)
    .default('en')
    .meta({ description: 'Target language.' }),
  model: z
    .strictObject({
      modelService: z.string().min(1).max(256),
      model: z.string().min(1).max(256),
    })
    .meta({
      description: 'An enabled offered chat model from the model catalog.',
    }),
});
const Result: z.ZodType<TranslationResult> = z.object({
  translation: z.string().meta({ description: 'The translated plain text.' }),
});

type TranslationEnv = AuthEnv & AuthorizationEnv;

export const aiTranslationRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes((app) => {
    const router = new Hono();
    const routes = new Hono<TranslationEnv>();
    const auth = app.container.resolve(authenticationToken);
    const authorization = app.container.resolve(authorizationToken);
    const agents = app.container.resolve(agentsToken);
    const logger = app.container.resolve(loggingToken).getLogger();

    routes.post(
      '/aiTranslation',
      auth.required({ scopedKeys: false }),
      authorization.middleware(),
      bodyLimit({
        // JSON may escape every input code unit as six ASCII bytes; allow the full valid text plus metadata.
        maxSize: TRANSLATION_MAX_LENGTH * 6 + 8192,
        onError: (context) =>
          apiErrorHandler(
            new ApiError({
              status: 'INVALID_ARGUMENT',
              reason: 'BODY_TOO_LARGE',
              domain: EXAMPLES_APP_DOMAIN,
              message: 'The translation request body is too large.',
              httpStatus: 413,
            }),
            context,
          ),
      }),
      describeRoute({
        tags,
        summary: 'Translate text with an online agent',
        operationId: 'examplesTranslateText',
        description:
          'Requires an unscoped signed-in person. Observes native structured background generation for up to 60 seconds and requests abort on timeout; this is not a guaranteed hard execution stop. Sessions remain in the existing owner chat history. Never automatically resend an interrupted request.',
        responses: {
          200: dataResponse(Result),
          ...apiErrorResponses,
          413: apiErrorResponse(413),
          504: apiErrorResponse(504, 'Translation observation timed out.'),
        },
      }),
      apiValidator('json', Input),
      async (context) => {
        const identity = context.get('auth')!;
        const input: TranslationInput = context.req.valid('json');
        try {
          const data = await translateText(
            {
              online: agents.onlineAgent,
              models: agents.models.gateway,
              warn: (message) => logger.warn(message),
            },
            {
              user: identity.user,
              authorization: context.get('authz'),
              credentials: identity,
            },
            input,
          );
          return context.json({ data });
        } catch (error) {
          if (!(error instanceof TranslationError)) throw error;
          const invalid = error.reason === 'TRANSLATION_INVALID_MODEL';
          const timeout = error.reason === 'TRANSLATION_TIMEOUT';
          throw new ApiError({
            status: invalid
              ? 'INVALID_ARGUMENT'
              : timeout
                ? 'DEADLINE_EXCEEDED'
                : 'INTERNAL',
            reason: error.reason,
            domain: EXAMPLES_APP_DOMAIN,
            message: invalid
              ? 'Choose an enabled offered chat model.'
              : timeout
                ? 'Translation observation timed out.'
                : 'Translation failed.',
            ...(invalid
              ? {
                  fieldViolations: [
                    {
                      field: 'model',
                      description: 'Choose an enabled offered chat model.',
                    },
                  ],
                }
              : {}),
          });
        }
      },
    );
    return router.route('/', routes);
  });
