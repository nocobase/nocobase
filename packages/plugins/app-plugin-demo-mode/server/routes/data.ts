import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
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
import { Hono, type Context } from 'hono';
import { z } from 'zod';

import { DEMO_MODE_ERROR_DOMAIN } from '../errors.js';
import { demoWriteGuardToken } from '../guard.js';
import { demoDataToken, demoConfigurationToken } from '../tokens.js';
import type { DemoDataStatus } from '../../shared/data.js';

/** The settings item whose grants open the demo data: `read` for its status, `manage` to import, clear and reset. */
export const DEMO_DATA_SETTINGS = 'demoMode.data';

const tags = ['Demo mode'];

const Account = z.object({
  username: z.string(),
  name: z.string(),
  role: z.string(),
  password: z.string(),
});

const DemoDataStatusSchema: z.ZodType<DemoDataStatus> = z
  .object({
    available: z.boolean().meta({
      description: 'Whether the application provides demo data at all.',
    }),
    datasetId: z.string().nullable(),
    languages: z.array(z.string()),
    present: z.boolean().meta({
      description: 'Whether the demo data is imported and complete.',
    }),
    state: z.enum(['importing', 'ready', 'clearing', 'failed']).nullable(),
    language: z.string().nullable(),
    createdAt: z.string().nullable(),
    finishedAt: z.string().nullable(),
    records: z.number(),
    counts: z.record(z.string(), z.number()),
    accounts: z.array(Account),
    accountsByLanguage: z.record(z.string(), z.array(Account)),
    operation: z.enum(['import', 'clear', 'reset']).nullable().meta({
      description:
        'What the import or clear under way was started as; a reset clears, then generates again.',
    }),
    importing: z.object({ percent: z.number() }).nullable(),
    failure: z
      .object({ code: z.string().optional(), message: z.string() })
      .nullable(),
    enabled: z.boolean(),
    model: z.object({ enabled: z.boolean(), service: z.string().nullable() }),
  })
  .meta({ ref: 'DemoModeDataStatus' });

const LanguageInput = z
  .object({
    language: z.string().max(16).optional().meta({
      description:
        'The language to import the demo in; the dataset’s first language when absent.',
    }),
  })
  .meta({ ref: 'DemoModeDataLanguage' });

const description = (text: string) =>
  `${text} Requires the \`settings:${DEMO_DATA_SETTINGS}\` grant (\`read\` for the status, \`manage\` otherwise).`;

const busy = apiErrorResponse(
  400,
  'An import or clear is under way (`DEMO_DATA_BUSY`), or the dataset cannot be written (its reason in `error.reason`). Application-wide cleanup requires demo mode (`DEMO_MODE_REQUIRED`).',
);

/** The demo data endpoints, for whoever holds the demo data settings grant. */
export const dataRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const router = new Hono();
    // Without sign-in and permissions nobody could be allowed to import, so the routes are left out.
    if (
      !container.has(authenticationToken) ||
      !container.has(authorizationToken)
    )
      return router;
    const data = new Hono<AuthorizationEnv>();
    const authentication = container.resolve(authenticationToken);
    const authorization = container.resolve(authorizationToken);
    const service = container.resolve(demoDataToken);
    data.onError(apiErrorHandler);
    data.use('*', authentication.required(), authorization.middleware());
    const requireAccess =
      (action: 'read' | 'manage') =>
      async (context: Context<AuthorizationEnv>, next: () => Promise<void>) => {
        container.resolve(demoConfigurationToken).requireEnabled();
        await context.get('authz').require({
          resource: { type: 'settings', id: DEMO_DATA_SETTINGS },
          action: 'read',
        });
        const allowed = await context.get('authz').can({
          resource: { type: 'settings', id: DEMO_DATA_SETTINGS },
          action,
        });
        if (!allowed)
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            reason: 'DEMO_DATA_ACCESS_REQUIRED',
            domain: DEMO_MODE_ERROR_DOMAIN,
            message: 'Demo data access is required.',
          });
        await next();
      };
    const actor = (context: Context<AuthorizationEnv>) =>
      String(context.get('authz').identity.principal.id);

    data.get(
      '/',
      requireAccess('read'),
      describeRoute({
        tags,
        summary: 'Get the demo data status',
        operationId: 'demoModeGetData',
        description: description(
          'Whether demo data is imported, how far an import has got, and the accounts each language creates.',
        ),
        responses: {
          200: dataResponse(DemoDataStatusSchema),
          ...apiErrorResponses,
        },
      }),
      async (context) => context.json({ data: await service.status() }),
    );
    data.post(
      '/import',
      requireAccess('manage'),
      describeRoute({
        tags,
        summary: 'Generate demo data',
        operationId: 'demoModeImportData',
        description: description(
          'Runs the application-defined dataset steps and answers at once, with request write protection enabled; read the status for generation progress. This endpoint accepts no uploaded data. Existing generated data is refused with `DEMO_DATA_EXISTS`.',
        ),
        responses: {
          200: dataResponse(DemoDataStatusSchema),
          ...apiErrorResponses,
          400: busy,
          404: apiErrorResponse(
            404,
            'The application provides no demo data (`DEMO_DATA_UNAVAILABLE`).',
          ),
          409: apiErrorResponse(
            409,
            'Demo data is imported already (`DEMO_DATA_EXISTS`).',
          ),
        },
      }),
      apiValidator('json', LanguageInput),
      async (context) =>
        context.json({
          data: await container
            .resolve(demoWriteGuardToken)
            .runDemoData(() =>
              service.start(actor(context), context.req.valid('json').language),
            ),
        }),
    );
    data.post(
      '/clear',
      requireAccess('manage'),
      describeRoute({
        tags,
        summary: 'Clear the demo data',
        operationId: 'demoModeClearData',
        description: description(
          'Runs the required application-wide business cleanup, including visitor additions, and disables tracked demo accounts for reuse. Preserves system configuration and the environment model. Requires enabled demo mode; cleanup also runs before the first import.',
        ),
        responses: {
          200: dataResponse(DemoDataStatusSchema),
          ...apiErrorResponses,
          400: busy,
          404: apiErrorResponse(
            404,
            'The application provides no demo dataset (`DEMO_DATA_UNAVAILABLE`), or demo mode is disabled (`DEMO_MODE_REQUIRED`).',
          ),
        },
      }),
      async (context) =>
        context.json({
          data: await container
            .resolve(demoWriteGuardToken)
            .runDemoData(() => service.clear(actor(context))),
        }),
    );
    data.post(
      '/reset',
      requireAccess('manage'),
      describeRoute({
        tags,
        summary: 'Reset the demo data',
        operationId: 'demoModeResetData',
        description: description(
          'Runs the required application-wide business cleanup, then generates the dataset again, and answers once the reset is claimed; read the status for its progress. Demo accounts the new import creates again keep their sessions and Permission Sets throughout. Preserves system configuration and the environment model. Requires enabled demo mode; this does not restore previous business data if the import fails.',
        ),
        responses: {
          200: dataResponse(DemoDataStatusSchema),
          ...apiErrorResponses,
          400: busy,
          404: apiErrorResponse(
            404,
            'The application provides no demo data (`DEMO_DATA_UNAVAILABLE`).',
          ),
        },
      }),
      apiValidator('json', LanguageInput),
      async (context) =>
        context.json({
          data: await container
            .resolve(demoWriteGuardToken)
            .runDemoData(() =>
              service.reset(actor(context), context.req.valid('json').language),
            ),
        }),
    );
    // Mounted on its own prefix, so its sign-in middleware never reaches the public status or model routes.
    router.route('/demoMode/data', data);
    return router;
  });
