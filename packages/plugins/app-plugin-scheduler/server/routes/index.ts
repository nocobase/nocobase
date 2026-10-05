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
  listResponse,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import { schedulerServiceToken } from '../services/scheduler.js';
import { ScheduleNotFoundError } from '../store.js';
import {
  encodeOccurrencePageToken,
  OccurrenceListQuery,
  ScheduleListQuery,
  ScheduleOccurrenceSchema,
  SchedulePageMeta,
  ScheduleParams,
  ScheduleSchema,
} from './schemas.js';

export const SCHEDULER_ACCESS_RESOURCE: string = 'scheduler.schedules';

/** The URL namespace of this plugin, and the `domain` of every error it reports. */
export const SCHEDULER_ERROR_DOMAIN: string = 'scheduler';

const tags = ['Scheduler'];
const scheduleNotFoundResponse = apiErrorResponse(
  404,
  'No Schedule with this id exists in the application (`SCHEDULE_NOT_FOUND`).',
);
const accessDescription =
  'Requires the `page:scheduler.schedules/access` grant; without it every route answers 403 `SCHEDULE_ACCESS_REQUIRED` before any Schedule is looked up.';

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
    const scheduleParams = apiValidator('param', ScheduleParams);

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
      describeRoute({
        tags,
        summary: 'List Schedules',
        operationId: 'schedulerListSchedules',
        description: `Pages by \`page\` and \`pageSize\`, ordered by title. ${accessDescription}`,
        responses: {
          200: listResponse(ScheduleSchema, SchedulePageMeta),
          ...apiErrorResponses,
        },
      }),
      apiValidator('query', ScheduleListQuery),
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
    schedules.get(
      '/schedules/:scheduleId',
      describeRoute({
        tags,
        summary: 'Get a Schedule',
        operationId: 'schedulerGetSchedule',
        description: accessDescription,
        responses: {
          200: dataResponse(ScheduleSchema),
          ...apiErrorResponses,
          404: scheduleNotFoundResponse,
        },
      }),
      scheduleParams,
      async (context) => {
        const { scheduleId } = context.req.valid('param');
        const item = await scheduler.get(scheduleId);
        if (!item) throw scheduleNotFound(scheduleId);
        return context.json({ data: item });
      },
    );
    schedules.get(
      '/schedules/:scheduleId/occurrences',
      describeRoute({
        tags,
        summary: 'List the occurrences of a Schedule',
        operationId: 'schedulerListOccurrences',
        description: `The firings of a Schedule, newest first. Pages by \`pageToken\`: pass \`meta.nextPageToken\` back unchanged; it is absent on the last page. ${accessDescription}`,
        responses: {
          200: listResponse(ScheduleOccurrenceSchema),
          ...apiErrorResponses,
          404: scheduleNotFoundResponse,
        },
      }),
      scheduleParams,
      apiValidator('query', OccurrenceListQuery),
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
      describeRoute({
        tags,
        summary: 'Enable a Schedule',
        operationId: 'schedulerEnableSchedule',
        description: `Switches the Schedule on and plans its next firing when its lifecycle is active. ${accessDescription}`,
        responses: {
          200: dataResponse(ScheduleSchema, 'The Schedule after the change.'),
          ...apiErrorResponses,
          404: scheduleNotFoundResponse,
        },
      }),
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
      describeRoute({
        tags,
        summary: 'Disable a Schedule',
        operationId: 'schedulerDisableSchedule',
        description: `Switches the Schedule off and removes its planned firing; the definition stays. ${accessDescription}`,
        responses: {
          200: dataResponse(ScheduleSchema, 'The Schedule after the change.'),
          ...apiErrorResponses,
          404: scheduleNotFoundResponse,
        },
      }),
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
