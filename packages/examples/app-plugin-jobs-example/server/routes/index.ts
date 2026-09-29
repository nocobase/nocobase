import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  defineApiRoutes,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono, type Context } from 'hono';

import { jobExampleServiceToken } from '../job/service.js';
import {
  ScheduleExampleError,
  scheduleExampleServiceToken,
} from '../schedule/service.js';

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const router = new Hono<AuthEnv>();
    const authentication = container.resolve(authenticationToken);
    const schedule = container.resolve(scheduleExampleServiceToken);
    const job = container.resolve(jobExampleServiceToken);

    router.use('/jobs-example/*', authentication.required());

    // The recurring rules: their state, next firing and recent runs, and the
    // start and stop actions of the ones a user may switch.
    router.get('/jobs-example/schedule', async (context) =>
      context.json(await schedule.status()),
    );
    router.post('/jobs-example/schedule/:name/start', async (context) => {
      const body: unknown = await context.req.json().catch(() => ({}));
      const every =
        typeof body === 'object' && body !== null && 'every' in body
          ? body.every
          : undefined;
      if (every !== undefined && typeof every !== 'number')
        return context.json(
          { code: 'INVALID_INTERVAL', message: 'every must be a number.' },
          400,
        );
      return respond(context, () =>
        schedule.startRule(context.req.param('name'), every),
      );
    });
    router.post('/jobs-example/schedule/:name/stop', (context) =>
      respond(context, () => schedule.stopRule(context.req.param('name'))),
    );

    // One-off tasks: create one, or list the signed-in user's recent ones.
    // The page receives every later change over the realtime topic.
    router.get('/jobs-example/job', (context) =>
      context.json(job.status(context.get('auth')!.user.id)),
    );
    router.post('/jobs-example/job', async (context) =>
      // 202: the task is accepted, not done.
      context.json(await job.create(context.get('auth')!.user.id), 202),
    );

    // The factory returns a plain Hono; mounting keeps AuthEnv typed inside.
    return new Hono().route('/', router);
  });

const routes: readonly AppApiRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];

export default routes;

/** Answers the rule's new state, or a 4xx for a request the service refused. */
async function respond(
  context: Context,
  action: () => Promise<void>,
): Promise<Response> {
  try {
    await action();
  } catch (error) {
    if (!(error instanceof ScheduleExampleError)) throw error;
    return context.json(
      { code: error.code, message: error.message },
      error.code === 'UNKNOWN_RULE' ? 404 : 400,
    );
  }
  return context.body(null, 204);
}
