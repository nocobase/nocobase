import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  apiErrorHandler,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { z } from 'zod';
import type { TaskExport } from '../../shared/business.js';
import { taskExportServiceToken } from '../export-service.js';

const ExportSchema: z.ZodType<TaskExport> = z
  .object({
    id: z.string(),
    status: z.enum(['queued', 'running', 'completed', 'failed']),
    processed: z.number().int(),
    total: z.number().int(),
    createdAt: z.iso.datetime(),
    finishedAt: z.iso.datetime().nullable(),
    reason: z.string().nullable(),
  })
  .meta({ ref: 'RealtimeTaskExport' });
const tags = ['RealtimeExample'];
export const exportRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const router = new Hono<AuthEnv>();
    const service = container.resolve(taskExportServiceToken);
    const auth = container.resolve(authenticationToken);
    router.onError(apiErrorHandler);
    router.use('/realtimeExample/exports', auth.required());
    router.use('/realtimeExample/exports/*', auth.required());
    router.get(
      '/realtimeExample/exports',
      describeRoute({
        tags,
        summary: 'List my task exports',
        operationId: 'realtimeExampleListExports',
        description: 'The latest 20 exports owned by the current user.',
        responses: {
          200: dataResponse(z.array(ExportSchema)),
          ...apiErrorResponses,
        },
      }),
      async (c) => c.json({ data: await service.list(c.get('auth')!.user.id) }),
    );
    router.post(
      '/realtimeExample/exports',
      describeRoute({
        tags,
        summary: 'Export my tasks',
        operationId: 'realtimeExampleCreateExport',
        description:
          'Queues a CSV snapshot of up to 5000 tasks visible to the requester. Only one export can be active per user on this example server. Completed files retain the permissions of their generation-time snapshot.',
        responses: { 202: dataResponse(ExportSchema), ...apiErrorResponses },
      }),
      apiValidator('json', z.strictObject({})),
      async (c) =>
        c.json({ data: await service.create(c.get('auth')!.user.id) }, 202),
    );
    router.get(
      '/realtimeExample/exports/:exportId/file',
      describeRoute({
        tags,
        summary: 'Read my exported CSV file',
        operationId: 'realtimeExampleGetExportFile',
        responses: {
          200: dataResponse(
            z.object({ fileName: z.string(), content: z.string() }),
          ),
          ...apiErrorResponses,
        },
      }),
      apiValidator(
        'param',
        z.object({ exportId: z.guid().transform((id) => id.toLowerCase()) }),
      ),
      async (c) =>
        c.json({
          data: await service.file(
            c.get('auth')!.user.id,
            c.req.valid('param').exportId,
          ),
        }),
    );
    return router as unknown as Hono;
  });
