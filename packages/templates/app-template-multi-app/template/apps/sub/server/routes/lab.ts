import { labPermission } from '../providers/lab-access.js';
import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import type { Application } from '@nocobase/app-server/application';
import {
  ApiError,
  defineApiRoutes,
  describeRoute,
  apiValidator,
  dataResponse,
  listResponse,
  apiErrorResponses,
  executeIdempotentMutation,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { databaseManagerToken, type DatabaseConnection } from '@nocobase/db';
import { Hono, type Context } from 'hono';
import { z } from 'zod';
import { LabService } from '../providers/lab.js';
import template from '../../shared/template.js';
import packageJson from '../../package.json' with { type: 'json' };
type Env = AuthEnv & AuthorizationEnv;
const recordInput = z.strictObject({
  name: z.string().trim().min(1).max(120),
  detail: z.string().trim().max(240),
  location: z.string().trim().min(1).max(120),
});
const recordView = recordInput.extend({
  id: z.string(),
  createdAt: z.string(),
});
const settingsInput = z.strictObject({
  manager: z.string().trim().max(80),
  location: z.string().trim().max(120),
  revision: z.number().int().nonnegative(),
});
function info(id: string, schema: z.ZodType): ReturnType<typeof describeRoute> {
  return describeRoute({
    tags: ['Laboratory'],
    operationId: id,
    summary: id,
    responses: { 200: dataResponse(schema), ...apiErrorResponses },
  });
}
async function admin(
  c: Pick<Context<Env>, 'get'>,
  action: 'read' | 'edit' | 'settings' = 'edit',
): Promise<void> {
  if (!(await c.get('authz').can(labPermission(action))))
    throw new ApiError({
      domain: 'lab',
      status: 'PERMISSION_DENIED',
      reason: 'ADMIN_REQUIRED',
      message: 'Administrator access required.',
    });
}
async function mutate<T>(
  app: Application,
  c: Context<Env>,
  operation: string,
  input: unknown,
  execute: (tx: DatabaseConnection) => Promise<T>,
): Promise<T> {
  const auth = c.get('auth');
  if (!auth || auth.credential)
    throw new ApiError({
      domain: 'lab',
      status: 'PERMISSION_DENIED',
      reason: 'USER_REQUIRED',
      message: 'User session required.',
    });
  const result = await executeIdempotentMutation({
    connection: app.container.resolve(databaseManagerToken).connection(),
    key: c.req.header('Idempotency-Key') || '',
    principal: auth.user.id,
    operation,
    input,
    authorize: () =>
      admin(c, operation === 'lab.settings' ? 'settings' : 'edit'),
    authorizeReplay: () =>
      admin(c, operation === 'lab.settings' ? 'settings' : 'edit'),
    execute,
  });
  c.header('Idempotency-Replayed', String(result.replayed));
  return result.data;
}
export const labRoutes: AppApiRouteContribution<Application> = defineApiRoutes(
  (app) => {
    const r = new Hono<Env>(),
      service = new LabService(app.container.resolve(databaseManagerToken));
    r.use(
      '*',
      app.container.resolve(authenticationToken).required(),
      app.container.resolve(authorizationToken).middleware(),
    );
    r.use('*', async (c, next) => {
      await admin(
        c,
        c.req.method === 'GET'
          ? 'read'
          : c.req.path.endsWith('/settings')
            ? 'settings'
            : 'edit',
      );
      await next();
    });
    r.get('/summary', info('labSummary', z.unknown()), async (c) =>
      c.json({
        data: {
          template: template.id,
          version: packageJson.version,
          name:
            app.config.get<string>('client.app.title') ||
            app.config.get<string>('app.name'),
          platformUrl: app.config.get<string>('platform.url'),
          // Preserve the previous response field for existing API consumers.
          portalUrl: app.config.get<string>('platform.url'),
          records: await service.list('', 0, 5),
          settings: await service.settings(),
        },
      }),
    );
    r.get(
      '/settings',
      info('labSettings', settingsInput.extend({ id: z.string() })),
      async (c) => c.json({ data: await service.settings() }),
    );
    r.put(
      '/settings',
      info('labSettingsSave', settingsInput.extend({ id: z.string() })),
      apiValidator('json', settingsInput),
      async (c) => {
        const input = c.req.valid('json');
        return c.json({
          data: await mutate(app, c, 'lab.settings', input, (tx) =>
            service.saveSettings(input, tx),
          ),
        });
      },
    );
    r.get(
      '/records',
      describeRoute({
        tags: ['Laboratory'],
        operationId: 'labRecords',
        summary: 'List records',
        responses: { 200: listResponse(recordView), ...apiErrorResponses },
      }),
      apiValidator(
        'query',
        z.object({
          search: z.string().trim().max(120).default(''),
          offset: z.coerce.number().int().min(0).default(0),
          limit: z.coerce.number().int().min(1).max(50).default(10),
          direction: z.enum(['asc', 'desc']).default('desc'),
        }),
      ),
      async (c) => {
        const q = c.req.valid('query');
        return c.json(
          await service.list(q.search, q.offset, q.limit, q.direction),
        );
      },
    );
    r.get(
      '/records/:id',
      info('labRecordRead', recordView),
      apiValidator('param', z.object({ id: z.uuid() })),
      async (c) => c.json({ data: await service.get(c.req.valid('param').id) }),
    );
    r.post(
      '/records',
      info('labRecordCreate', recordView),
      apiValidator('json', recordInput),
      async (c) => {
        const input = c.req.valid('json');
        return c.json({
          data: await mutate(app, c, 'lab.records.create', input, (tx) =>
            service.create(input, tx),
          ),
        });
      },
    );
    r.delete(
      '/records/:id',
      info('labRecordDelete', z.object({ id: z.string() })),
      apiValidator('param', z.object({ id: z.uuid() })),
      async (c) => {
        const { id } = c.req.valid('param');
        return c.json({
          data: await mutate(app, c, `lab.records.delete:${id}`, { id }, (tx) =>
            service.remove(id, tx),
          ),
        });
      },
    );
    return new Hono().route('/lab', r);
  },
);
