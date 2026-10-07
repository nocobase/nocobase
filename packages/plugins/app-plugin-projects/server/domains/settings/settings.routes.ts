import {
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  describeRoute,
} from '@nocobase/app-server/router';
import type { Hono } from 'hono';

import { viewerOf, type ViewerEnv } from '../../access/request.js';
import { domainRouter, tags } from '../../kernel/http.js';
import {
  UpdateSettingsBody,
  WorkspaceSettingsSchema,
} from '../../routes/schemas.js';
import type { SettingsService } from './settings.service.js';

/** `/api/projects/settings`. */
export function createSettingsRoutes(
  settings: SettingsService,
): Hono<ViewerEnv> {
  const routes = domainRouter<ViewerEnv>();
  routes.get(
    '/',
    describeRoute({
      tags,
      summary: 'Get the workspace settings',
      operationId: 'projectsGetSettings',
      ...cliRoute({
        command: 'project settings get',
      }),
      description: 'Needs `read` on the `pm.general` settings item.',
      responses: {
        200: dataResponse(WorkspaceSettingsSchema),
        ...apiErrorResponses,
      },
    }),
    async (context) =>
      context.json({ data: await settings.get(viewerOf(context)) }),
  );
  routes.patch(
    '/',
    describeRoute({
      tags,
      summary: 'Update the workspace settings',
      operationId: 'projectsUpdateSettings',
      ...cliRoute({
        command: 'project settings update',
        examples: ['project settings update --issue-prefix PM'],
      }),
      description:
        'Needs `update` on the `pm.general` settings item. A new issue prefix applies to new issues only.',
      responses: {
        200: dataResponse(WorkspaceSettingsSchema),
        ...apiErrorResponses,
      },
    }),
    apiValidator('json', UpdateSettingsBody),
    async (context) =>
      context.json({
        data: await settings.update(
          viewerOf(context),
          context.req.valid('json'),
        ),
      }),
  );
  return routes;
}
