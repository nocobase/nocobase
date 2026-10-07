import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  describeRoute,
} from '@nocobase/app-server/router';
import type { Hono } from 'hono';

import { viewerOf, type ViewerEnv } from '../../access/request.js';
import { domainRouter, tags } from '../../kernel/http.js';
import { IssueParams, SubscriptionStateSchema } from '../../routes/schemas.js';
import type { SubscriptionService } from './subscription.service.js';

/** Under `/api/projects/issues`: `POST /{issueId}/subscribe` and `/unsubscribe`, answering `{ subscribed }`. */
export function createSubscriptionRoutes(
  subscriptions: SubscriptionService,
): Hono<ViewerEnv> {
  const routes = domainRouter<ViewerEnv>();
  for (const [verb, subscribed] of [
    ['subscribe', true],
    ['unsubscribe', false],
  ] as const)
    routes.post(
      `/:issueId/${verb}`,
      describeRoute({
        tags,
        summary: subscribed ? 'Follow an issue' : 'Stop following an issue',
        operationId: subscribed
          ? 'projectsSubscribeIssue'
          : 'projectsUnsubscribeIssue',
        ...cliRoute({
          command: `issue ${verb}`,
          flags: { issueId: { name: 'issue' } },
          action: 'pm.issues/view',
        }),
        description:
          'Following brings the issue’s comments and status changes to the inbox. `issueId` is an id or an identifier.',
        responses: {
          200: dataResponse(SubscriptionStateSchema),
          ...apiErrorResponses,
          404: apiErrorResponse(404),
        },
      }),
      apiValidator('param', IssueParams),
      async (context) =>
        context.json({
          data: await subscriptions.set(
            viewerOf(context),
            context.req.valid('param').issueId,
            subscribed,
          ),
        }),
    );
  return routes;
}
