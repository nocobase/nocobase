import { authenticationToken } from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  defineApiRoutes,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import {
  GREETING_CHANNEL,
  QUEUE_EXAMPLE_QUEUE,
  queueExampleServiceToken,
} from '../service.js';

/** Longest delay the greeting route accepts, in milliseconds. */
const MAX_DELAY_MS = 600_000;

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const router = new Hono();
    const authentication = container.resolve(authenticationToken);
    const service = container.resolve(queueExampleServiceToken);

    // Matches /queue-example itself and every path below it.
    router.use('/queue-example/*', authentication.required());

    // Publishes one greeting, after `?delay=<ms>` when given. The receipt
    // means the queue accepted the job; the handlers run afterwards, as
    // /queue-example/deliveries shows.
    router.get('/queue-example', async (context) => {
      const requested = context.req.query('delay');
      const delay = requested === undefined ? 0 : Number(requested);
      if (!Number.isInteger(delay) || delay < 0 || delay > MAX_DELAY_MS) {
        return context.json(
          {
            code: 'INVALID_DELAY',
            message: `delay must be an integer from 0 to ${MAX_DELAY_MS}.`,
          },
          400,
        );
      }
      const { jobId } = await service.greet(
        'Hello from the Queue example plugin',
        delay,
      );
      return context.json(
        { jobId, queue: QUEUE_EXAMPLE_QUEUE, channel: GREETING_CHANNEL },
        202,
      );
    });

    // Publishes a batch: every entry is prepared before any is written.
    router.post('/queue-example/digests', async (context) => {
      const today = new Date().toISOString().slice(0, 10);
      const receipts = await service.publishDigests([
        `${today}-morning`,
        `${today}-evening`,
      ]);
      return context.json({ receipts }, 202);
    });

    router.get('/queue-example/deliveries', (context) =>
      context.json(service.status()),
    );

    return router;
  });

const routes: readonly AppApiRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];

export default routes;
