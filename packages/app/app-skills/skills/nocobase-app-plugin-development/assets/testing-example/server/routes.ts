import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import type { AuthorizationEnv } from '@nocobase/authorization/core';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  apiErrorResponses,
  defineApiRoutes,
  describeRoute,
  listResponse,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { z } from 'zod';

import { readingListToken, type ReadingEntry } from './service.js';

const EntrySchema: z.ZodType<ReadingEntry> = z.object({
  id: z.string(),
  title: z.string(),
});

export const readingListRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const router = new Hono<AuthorizationEnv>();
    const service = container.resolve(readingListToken);
    router.use(
      '/readingList',
      container.resolve(authenticationToken).required(),
    );
    router.use(
      '/readingList',
      container.resolve(authorizationToken).middleware(),
    );
    router.get(
      '/readingList',
      async (context, next) => {
        await context.get('authz').require({
          resource: { type: 'readingList', id: 'shared' },
          action: 'read',
        });
        await next();
      },
      describeRoute({
        tags: ['ReadingList'],
        summary: 'List shared reading entries',
        operationId: 'readingListListEntries',
        responses: { '200': listResponse(EntrySchema), ...apiErrorResponses },
      }),
      async (context) =>
        context.json({
          data: await service.list(),
          meta: { total: await service.count() },
        }),
    );
    return new Hono().route('/', router);
  });
