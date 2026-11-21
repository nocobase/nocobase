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
import { createMiddleware } from 'hono/factory';

import {
  SCHEDULER_SETTINGS_ID,
  type SchedulerAction,
} from '../authorization.js';
import { schedulerServiceToken } from '../services/scheduler.js';
import { ScheduleNotFoundError } from '../store.js';
import {
  encodeHistoryPageToken,
  encodeOccurrencePageToken,
  HistoryListQuery,
  HistoryPageMeta,
  OccurrenceListQuery,
  ScheduleDetailSchema,
  ScheduleListQuery,
  ScheduleOccurrenceSchema,
  SchedulePageMeta,
  ScheduleParams,
  ScheduleSchema,
} from './schemas.js';

/** The URL namespace of this plugin, and the `domain` of every error it reports. */
export const SCHEDULER_ERROR_DOMAIN: string = 'scheduler';

const tags = ['Scheduler'];
const scheduleNotFoundResponse = apiErrorResponse(
  404,
  'No Schedule with this id exists in the application (`SCHEDULE_NOT_FOUND`).',
);
const readDescription =
  'Requires `read` on the `scheduler.schedules` settings item; without it the route answers 403 `SCHEDULE_ACCESS_REQUIRED` before any Schedule is looked up.';
const manageDescription =
  'Requires `manage` on the `scheduler.schedules` settings item; without it the route answers 403 `SCHEDULE_MANAGE_REQUIRED` before any Schedule is looked up.';

const deniedReasons: Readonly<Record<SchedulerAction, string>> = {
  read: 'SCHEDULE_ACCESS_REQUIRED',
  manage: 'SCHEDULE_MANAGE_REQUIRED',
};

/**
 * Checks one action of the `scheduler.schedules` settings item. It runs before validation and before any Schedule is
 * looked up, so a caller without it cannot probe which ids exist. `read` and `manage` are separate grants: neither
 * implies the other.
 */
function requireSettings(action: SchedulerAction) {
  return createMiddleware<AuthorizationEnv>(async (context, next) => {
    const allowed = await context.get('authz').can({
      resource: { type: 'settings', id: SCHEDULER_SETTINGS_ID },
      action,
    });
    if (!allowed)
      throw new ApiError({
        status: 'PERMISSION_DENIED',
        reason: deniedReasons[action],
        domain: SCHEDULER_ERROR_DOMAIN,
        message:
          action === 'read'
            ? 'Schedule access is required.'
            : 'Permission to manage Schedules is required.',
      });
    await next();
  });
}

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
    const read = requireSettings('read');
    const manage = requireSettings('manage');

    schedules.get(
      '/occurrences',
      read,
      describeRoute({
        tags,
        summary: 'List the occurrences of every Schedule',
        operationId: 'schedulerListAllOccurrences',
        description: `The firings of every Schedule of the application, including those removed from code, newest first by start time. Filters by \`scheduleId\`, \`status\` and a \`from\`/\`to\` range; pages by \`pageToken\`: pass \`meta.nextPageToken\` back unchanged, with the same filters; it is absent on the last page. A firing recorded while paging never repeats or hides a row. ${readDescription}`,
        responses: {
          200: listResponse(ScheduleOccurrenceSchema, HistoryPageMeta),
          ...apiErrorResponses,
        },
      }),
      apiValidator('query', HistoryListQuery),
      async (context) => {
        const { scheduleId, status, from, to, pageSize, pageToken } =
          context.req.valid('query');
        // One row past the page tells whether another page follows without counting the whole history.
        const rows = await scheduler.listAllOccurrences({
          ...(scheduleId ? { scheduleId } : {}),
          ...(status ? { statuses: status } : {}),
          ...(from ? { from: new Date(from) } : {}),
          ...(to ? { to: new Date(to) } : {}),
          ...(pageToken ? { after: pageToken } : {}),
          limit: pageSize + 1,
        });
        const page = rows.slice(0, pageSize);
        const last = page.at(-1);
        return context.json({
          data: page,
          meta:
            rows.length > pageSize && last
              ? {
                  nextPageToken: encodeHistoryPageToken(
                    last.startedAt,
                    last.id,
                  ),
                }
              : {},
        });
      },
    );
    schedules.get(
      '/schedules',
      read,
      describeRoute({
        tags,
        summary: 'List Schedules',
        operationId: 'schedulerListSchedules',
        description: `Pages by \`page\` and \`pageSize\`, ordered by title. \`meta.jobs\` describes the jobs configuration the Schedules run on, without credentials, and the Schedules removed from code that still await \`scheduler sync --finalize\`. ${readDescription}`,
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
        const jobs = scheduler.jobs();
        return context.json({
          data: items.slice(start, start + pageSize),
          meta: {
            page,
            pageSize,
            total: items.length,
            ...(jobs
              ? {
                  jobs: {
                    ...jobs,
                    removedFromCode: scheduler.removedFromCode(items),
                  },
                }
              : {}),
          },
        });
      },
    );
    schedules.get(
      '/schedules/:scheduleId',
      read,
      describeRoute({
        tags,
        summary: 'Get a Schedule',
        operationId: 'schedulerGetSchedule',
        description: `The Schedule with its next firings in \`upcomingRuns\`. ${readDescription}`,
        responses: {
          200: dataResponse(ScheduleDetailSchema),
          ...apiErrorResponses,
          404: scheduleNotFoundResponse,
        },
      }),
      scheduleParams,
      async (context) => {
        const { scheduleId } = context.req.valid('param');
        const item = await scheduler.detail(scheduleId);
        if (!item) throw scheduleNotFound(scheduleId);
        return context.json({ data: item });
      },
    );
    schedules.get(
      '/schedules/:scheduleId/occurrences',
      read,
      describeRoute({
        tags,
        summary: 'List the occurrences of a Schedule',
        operationId: 'schedulerListOccurrences',
        description: `The firings of a Schedule, newest first. Pages by \`pageToken\`: pass \`meta.nextPageToken\` back unchanged; it is absent on the last page. ${readDescription}`,
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
      manage,
      describeRoute({
        tags,
        summary: 'Enable a Schedule',
        operationId: 'schedulerEnableSchedule',
        description: `Switches the Schedule on and plans its next firing when its lifecycle is active. ${manageDescription}`,
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
      manage,
      describeRoute({
        tags,
        summary: 'Disable a Schedule',
        operationId: 'schedulerDisableSchedule',
        description: `Switches the Schedule off and removes its planned firing; the definition stays. ${manageDescription}`,
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
