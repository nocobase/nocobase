import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
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
  emptyResponse,
  listResponse,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono, type MiddlewareHandler } from 'hono';

import { JOBS_EXAMPLE_SETTINGS } from '../authorization.js';
import { jobExampleServiceToken } from '../job/service.js';
import {
  ScheduleExampleError,
  scheduleExampleServiceToken,
} from '../schedule/service.js';
import {
  JobTask,
  RuleParams,
  ScheduleRule,
  StartRuleInput,
} from './schemas.js';

/** The namespace of every route this plugin owns, and the domain of its errors. */
export const JOBS_EXAMPLE_DOMAIN = 'jobsExample';

/** Every route of this plugin is listed under one tag in the API document at `/api/swagger/docs`. */
const tags = ['JobsExample'];

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const router = new Hono<AuthEnv & AuthorizationEnv>();
    const authentication = container.resolve(authenticationToken);
    const authorization = container.resolve(authorizationToken);
    const schedule = container.resolve(scheduleExampleServiceToken);
    const job = container.resolve(jobExampleServiceToken);

    router.use('/jobsExample/*', authentication.required());
    router.use('/jobsExample/rules/*', authorization.middleware());

    // Switching a rule changes it for the whole application, so it takes `settings:jobsExample.schedules` `update`.
    // Checked before the path and body are validated: a caller without it is answered 403 whatever it sent.
    const requireSwitch: MiddlewareHandler<AuthorizationEnv> = async (
      context,
      next,
    ) => {
      await context.var.authz.require({
        resource: { type: 'settings', id: JOBS_EXAMPLE_SETTINGS },
        action: 'update',
      });
      await next();
    };

    // The recurring rules: their state, next firing and recent runs, and the
    // start and stop actions of the ones a user may switch.
    // Bounded lists: the plugin defines every rule in code and keeps a user's
    // recent tasks only, so both answer at once with `meta.total`.
    router.get(
      '/jobsExample/rules',
      describeRoute({
        tags,
        summary: 'List schedule rules',
        operationId: 'jobsExampleListRules',
        description:
          'Every recurring rule with its state, next firing and recent runs. A bounded list: it is not paged and answers `meta.total`.',
        responses: {
          200: listResponse(ScheduleRule),
          401: apiErrorResponse(401),
          500: apiErrorResponse(500),
        },
      }),
      async (context) => {
        const { rules } = await schedule.status();
        return context.json({ data: rules, meta: { total: rules.length } });
      },
    );
    // The declaration follows the permission check and precedes the validators, which document the path and body.
    router.post(
      '/jobsExample/rules/:ruleName/start',
      requireSwitch,
      describeRoute({
        tags,
        summary: 'Start a schedule rule',
        operationId: 'jobsExampleStartRule',
        description:
          "Writes the rule for every instance. `every` changes the `interval` rule's interval in milliseconds; without it the rule keeps its own. Requires `settings:jobsExample.schedules` `update`.",
        responses: {
          204: emptyResponse('The rule was started.'),
          ...apiErrorResponses,
          400: apiErrorResponse(
            400,
            'The rule is built in and cannot be switched (`BUILT_IN_RULE`), or `every` is not an interval this rule accepts (`INVALID_INTERVAL`).',
          ),
          404: apiErrorResponse(404, 'No rule has this name (`UNKNOWN_RULE`).'),
        },
      }),
      apiValidator('param', RuleParams),
      apiValidator('json', StartRuleInput),
      async (context) => {
        const { ruleName } = context.req.valid('param');
        const { every } = context.req.valid('json');
        await schedule.startRule(ruleName, every);
        return context.body(null, 204);
      },
    );
    router.post(
      '/jobsExample/rules/:ruleName/stop',
      requireSwitch,
      describeRoute({
        tags,
        summary: 'Stop a schedule rule',
        operationId: 'jobsExampleStopRule',
        description:
          'Removes the rule for every instance. Requires `settings:jobsExample.schedules` `update`.',
        responses: {
          204: emptyResponse('The rule was stopped.'),
          ...apiErrorResponses,
          400: apiErrorResponse(
            400,
            'The rule is built in and cannot be switched (`BUILT_IN_RULE`).',
          ),
          404: apiErrorResponse(404, 'No rule has this name (`UNKNOWN_RULE`).'),
        },
      }),
      apiValidator('param', RuleParams),
      async (context) => {
        await schedule.stopRule(context.req.valid('param').ruleName);
        return context.body(null, 204);
      },
    );

    // One-off tasks: create one, or list the signed-in user's recent ones.
    // The page receives every later change over the realtime topic.
    router.get(
      '/jobsExample/tasks',
      describeRoute({
        tags,
        summary: 'List my recent tasks',
        operationId: 'jobsExampleListTasks',
        description:
          "The signed-in user's recent one-off tasks. A bounded list: it is not paged and answers `meta.total`.",
        responses: {
          200: listResponse(JobTask),
          401: apiErrorResponse(401),
          500: apiErrorResponse(500),
        },
      }),
      (context) => {
        const { tasks } = job.status(context.get('auth')!.user.id);
        return context.json({ data: tasks, meta: { total: tasks.length } });
      },
    );
    router.post(
      '/jobsExample/tasks',
      describeRoute({
        tags,
        summary: 'Create a task',
        operationId: 'jobsExampleCreateTask',
        description:
          'Submits one progress task for the signed-in user. `202` means the job backend accepted it; later changes arrive over the realtime topic and in `GET /api/jobsExample/tasks`.',
        responses: {
          202: dataResponse(JobTask, 'The task was accepted.'),
          401: apiErrorResponse(401),
          500: apiErrorResponse(500),
        },
      }),
      async (context) =>
        // 202: the task is accepted, not done.
        context.json(
          { data: await job.create(context.get('auth')!.user.id) },
          202,
        ),
    );

    router.onError((error, context) =>
      apiErrorHandler(
        error instanceof ScheduleExampleError ? toApiError(error) : error,
        context,
      ),
    );

    // The factory returns a plain Hono; mounting keeps AuthEnv typed inside.
    return new Hono().route('/', router);
  });

const routes: readonly AppApiRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];

export default routes;

function toApiError(error: ScheduleExampleError): ApiError {
  const common = {
    reason: error.code,
    domain: JOBS_EXAMPLE_DOMAIN,
    message: error.message,
    cause: error,
  };
  switch (error.code) {
    case 'UNKNOWN_RULE':
      return new ApiError({ status: 'NOT_FOUND', ...common });
    case 'BUILT_IN_RULE':
      return new ApiError({ status: 'FAILED_PRECONDITION', ...common });
    case 'INVALID_INTERVAL':
      return new ApiError({
        status: 'INVALID_ARGUMENT',
        ...common,
        fieldViolations: [{ field: 'every', description: error.message }],
      });
  }
}
