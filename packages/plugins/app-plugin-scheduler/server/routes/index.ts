import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  ApiError,
  apiErrorHandler,
  defineApiRoutes,
  parseApiInput,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { validator } from 'hono/validator';

import { schedulerServiceToken } from '../services/scheduler.js';
import { ScheduleNotFoundError } from '../store.js';
import {
  encodeOccurrencePageToken,
  OccurrenceListQuery,
  ScheduleListQuery,
  ScheduleParams,
} from './schemas.js';

export const SCHEDULER_ACCESS_RESOURCE: string = 'scheduler.schedules';

/** The URL namespace of this plugin, and the `domain` of every error it reports. */
export const SCHEDULER_ERROR_DOMAIN: string = 'scheduler';

function scheduleNotFound(scheduleId: string): ApiError {
  return new ApiError({
    status: 'NOT_FOUND',
    reason: 'SCHEDULE_NOT_FOUND',
    domain: SCHEDULER_ERROR_DOMAIN,
    message: `Schedule ${scheduleId} was not found.`,
  });
}

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const router = new Hono();
    const schedules = new Hono<AuthorizationEnv>();
    const authentication = container.resolve(authenticationToken);
    const authorization = container.resolve(authorizationToken);
    const scheduler = container.resolve(schedulerServiceToken);
    const scheduleParams = validator('param', (value) =>
      parseApiInput(ScheduleParams, value),
    );

    // Render this plugin's errors here as well as through the application, so the router answers with the standard
    // body even when it is mounted on its own. Anything else belongs to the application's handler.
    schedules.onError((error, context) =>
      apiErrorHandler(
        error instanceof ScheduleNotFoundError
          ? scheduleNotFound(error.scheduleId)
          : error,
        context,
      ),
    );

    schedules.use('*', authentication.required(), authorization.middleware());
    // Permission is checked before any schedule is looked up, so a caller without access cannot probe which ids exist.
    schedules.use('*', async (context, next) => {
      const allowed = await context.get('authz').can({
        resource: { type: 'page', id: SCHEDULER_ACCESS_RESOURCE },
        action: 'access',
      });
      if (!allowed)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          reason: 'SCHEDULE_ACCESS_REQUIRED',
          domain: SCHEDULER_ERROR_DOMAIN,
          message: 'Schedule access is required.',
        });
      await next();
    });

    schedules.get(
      '/schedules',
      validator('query', (value) => parseApiInput(ScheduleListQuery, value)),
      async (context) => {
        const { page, pageSize } = context.req.valid('query');
        const items = await scheduler.list();
        const start = (page - 1) * pageSize;
        return context.json({
          data: items.slice(start, start + pageSize),
          meta: { page, pageSize, total: items.length },
        });
      },
    );
    schedules.get('/schedules/:scheduleId', scheduleParams, async (context) => {
      const { scheduleId } = context.req.valid('param');
      const item = await scheduler.get(scheduleId);
      if (!item) throw scheduleNotFound(scheduleId);
      return context.json({ data: item });
    });
    schedules.get(
      '/schedules/:scheduleId/occurrences',
      scheduleParams,
      validator('query', (value) => parseApiInput(OccurrenceListQuery, value)),
      async (context) => {
        const { scheduleId } = context.req.valid('param');
        const { pageSize, pageToken: offset } = context.req.valid('query');
        if (!(await scheduler.get(scheduleId)))
          throw scheduleNotFound(scheduleId);
        // One row past the page tells whether another page follows without counting the whole history.
        const rows = await scheduler.listOccurrences(scheduleId, {
          offset,
          limit: pageSize + 1,
        });
        const hasMore = rows.length > pageSize;
        return context.json({
          data: rows.slice(0, pageSize),
          meta: hasMore
            ? { nextPageToken: encodeOccurrencePageToken(offset + pageSize) }
            : {},
        });
      },
    );
    schedules.post(
      '/schedules/:scheduleId/enable',
      scheduleParams,
      async (context) => {
        const { scheduleId } = context.req.valid('param');
        return context.json({
          data: await scheduler.setEnabled(scheduleId, true),
        });
      },
    );
    schedules.post(
      '/schedules/:scheduleId/disable',
      scheduleParams,
      async (context) => {
        const { scheduleId } = context.req.valid('param');
        return context.json({
          data: await scheduler.setEnabled(scheduleId, false),
        });
      },
    );
    router.route('/scheduler', schedules);
    return router;
  });

const routes: readonly AppApiRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];
export default routes;
