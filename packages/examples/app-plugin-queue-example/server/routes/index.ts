import { authenticationToken } from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  apiErrorHandler,
  apiErrorResponse,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { z } from 'zod';

import {
  GREETING_CHANNEL,
  QUEUE_EXAMPLE_QUEUE,
  queueExampleServiceToken,
} from '../service.js';
import {
  DigestReceipt,
  GreetInput,
  GreetingReceipt,
  QueueExampleStatus,
} from './schemas.js';

/** Every route of this plugin is listed under one tag in the API document at `/api/swagger/docs`. */
const tags = ['QueueExample'];

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
      describeRoute({
        tags,
        summary: 'Publish a greeting',
        operationId: 'queueExamplePublishGreeting',
        description:
          'Publishes one greeting to the example queue, held back for `delay` milliseconds when given. `202` means the queue accepted the job; both handlers run afterwards, as `GET /api/queueExample/status` shows.',
        responses: {
          202: dataResponse(GreetingReceipt, 'The queue accepted the job.'),
          401: apiErrorResponse(401),
          500: apiErrorResponse(500),
        },
      }),
      apiValidator('json', GreetInput),
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
    router.post(
      '/queueExample/digests',
      describeRoute({
        tags,
        summary: "Publish today's digests",
        operationId: 'queueExamplePublishDigests',
        description:
          "Publishes this morning's and this evening's digest in one batch. Each job id is derived from the day, so publishing again on the same day adds nothing and answers the same receipts.",
        responses: {
          202: dataResponse(
            z.array(DigestReceipt),
            'The queue accepted the batch.',
          ),
          401: apiErrorResponse(401),
          500: apiErrorResponse(500),
        },
      }),
      async (context) => {
        const today = new Date().toISOString().slice(0, 10);
        const receipts = await service.publishDigests([
          `${today}-morning`,
          `${today}-evening`,
        ]);
        return context.json({ data: receipts }, 202);
      },
    );

    router.get(
      '/queueExample/status',
      describeRoute({
        tags,
        summary: 'Get the queue status',
        operationId: 'queueExampleGetStatus',
        description:
          'What the handlers received since the application started. The records live in memory, so a restart clears them while the queue keeps pending jobs.',
        responses: {
          200: dataResponse(QueueExampleStatus),
          401: apiErrorResponse(401),
          500: apiErrorResponse(500),
        },
      }),
      (context) => context.json({ data: service.status() }),
    );

    router.onError(apiErrorHandler);
    return router;
  });

const routes: readonly AppApiRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];

export default routes;
