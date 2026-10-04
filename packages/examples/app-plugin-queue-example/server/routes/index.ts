import { authenticationToken } from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  apiErrorHandler,
  defineApiRoutes,
  parseApiInput,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { validator } from 'hono/validator';

import {
  GREETING_CHANNEL,
  QUEUE_EXAMPLE_QUEUE,
  queueExampleServiceToken,
} from '../service.js';
import { GreetInput } from './schemas.js';

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const router = new Hono();
    const authentication = container.resolve(authenticationToken);
    const service = container.resolve(queueExampleServiceToken);

    // Matches every path below /queueExample and nothing a later plugin owns.
    router.use('/queueExample/*', authentication.required());

    // Publishes one greeting, after `{ "delay": <ms> }` when given. The receipt
    // means the queue accepted the job; the handlers run afterwards, as
    // /queueExample/status shows.
    router.post(
      '/queueExample/greet',
      validator('json', (value) => parseApiInput(GreetInput, value)),
      async (context) => {
        const { delay = 0 } = context.req.valid('json');
        const { jobId } = await service.greet(
          'Hello from the Queue example plugin',
          delay,
        );
        return context.json(
          {
            data: {
              jobId,
              queue: QUEUE_EXAMPLE_QUEUE,
              channel: GREETING_CHANNEL,
            },
          },
          202,
        );
      },
    );

    // Publishes a batch: every entry is prepared before any is written.
    router.post('/queueExample/digests', async (context) => {
      const today = new Date().toISOString().slice(0, 10);
      const receipts = await service.publishDigests([
        `${today}-morning`,
        `${today}-evening`,
      ]);
      return context.json({ data: receipts }, 202);
    });

    router.get('/queueExample/status', (context) =>
      context.json({ data: service.status() }),
    );

    router.onError(apiErrorHandler);
    return router;
  });

const routes: readonly AppApiRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];

export default routes;
