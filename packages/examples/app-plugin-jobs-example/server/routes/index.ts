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
  defineApiRoutes,
  parseApiInput,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono, type MiddlewareHandler } from 'hono';
import { validator } from 'hono/validator';

import { JOBS_EXAMPLE_SETTINGS } from '../authorization.js';
import { jobExampleServiceToken } from '../job/service.js';
import {
  ScheduleExampleError,
  scheduleExampleServiceToken,
} from '../schedule/service.js';
import { RuleParams, StartRuleInput } from './schemas.js';

/** The namespace of every route this plugin owns, and the domain of its errors. */
export const JOBS_EXAMPLE_DOMAIN = 'jobsExample';

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
    router.get('/jobsExample/rules', async (context) => {
      const { rules } = await schedule.status();
      return context.json({ data: rules, meta: { total: rules.length } });
    });
    router.post(
      '/jobsExample/rules/:ruleName/start',
      requireSwitch,
      validator('param', (value) => parseApiInput(RuleParams, value)),
      validator('json', (value) => parseApiInput(StartRuleInput, value)),
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
      validator('param', (value) => parseApiInput(RuleParams, value)),
      async (context) => {
        await schedule.stopRule(context.req.valid('param').ruleName);
        return context.body(null, 204);
      },
    );

    // One-off tasks: create one, or list the signed-in user's recent ones.
    // The page receives every later change over the realtime topic.
    router.get('/jobsExample/tasks', (context) => {
      const { tasks } = job.status(context.get('auth')!.user.id);
      return context.json({ data: tasks, meta: { total: tasks.length } });
    });
    router.post('/jobsExample/tasks', async (context) =>
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
