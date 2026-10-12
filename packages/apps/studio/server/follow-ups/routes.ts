/**
 * `/api/followUps`, the "My follow-ups" page's data (`service.ts`, `shared/follow-ups.ts`): what the caller owns and
 * follows, what they follow, and when they last looked at an issue. Every route is the signed-in person's own and needs
 * `pm.issues` view; a scoped API key and a run are refused, as for the person's other preferences.
 *
 * - `GET /followUps`: the overview.
 * - `PUT /followUps/following`: replaces the followed issues.
 * - `POST /followUps/issues/{issueId}/markSeen`: the caller looked at the issue now.
 */
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import {
  projectsAccessToken,
  projectsToken,
} from '@nocobase/app-plugin-projects/server/tokens';
import { userPreferencesServiceToken } from '@nocobase/app-plugin-users/server/tokens';
import type { Application } from '@nocobase/app-server/application';
import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  emptyResponse,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono, type Context } from 'hono';
import { z } from 'zod';

import { createPermissionSource } from '../agents/commands/permissions.js';
import { createAskerLookup } from '../agents/conversation/acting.js';
import { callerOfRequest } from '../agents/run-principal.js';
import { studioError, studioErrorHandler } from '../http/errors.js';
import {
  FollowingInputSchema,
  FollowingViewSchema,
  FollowUpsViewSchema,
} from './schemas.js';
import { createFollowUps } from './service.js';

const tags = ['Studio'];
const Params = z.object({ issueId: z.string().min(1) });

export const followUpsRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes(({ container }) => {
    if (
      !container.has(authenticationToken) ||
      !container.has(authorizationToken) ||
      !container.has(projectsToken) ||
      !container.has(agentsToken) ||
      !container.has(userPreferencesServiceToken)
    )
      return new Hono();
    const agents = container.resolve(agentsToken);
    const projects = container.resolve(projectsToken);
    const followUps = createFollowUps({
      projects,
      agents,
      preferences: container.resolve(userPreferencesServiceToken),
    });
    const permissions = createPermissionSource(
      () =>
        container.has(projectsAccessToken)
          ? container.resolve(projectsAccessToken)
          : undefined,
      createAskerLookup(agents),
    );

    const routes = new Hono();
    routes.onError(studioErrorHandler);
    // The person's own, like their preferences: a scoped API key is refused.
    routes.use('*', container.resolve(authenticationToken).required());
    routes.use('*', container.resolve(authorizationToken).middleware());

    /** The caller as the projects plugin sees them, when they may view issues; 403 otherwise. */
    const viewerOf = async (context: Context) => {
      const identity = callerOfRequest(context);
      if (
        !identity ||
        identity.kind !== 'user' ||
        !(await agents.gate.allowed(identity)).has('pm.issues/view')
      )
        throw studioError(
          'PERMISSION_DENIED',
          'ACTION_FORBIDDEN',
          'This action is not allowed.',
        );
      return permissions.viewerOf(identity);
    };

    routes.get(
      '/',
      describeRoute({
        tags,
        summary: 'Get my follow-ups',
        operationId: 'followUpsGet',
        ...cliRoute({ command: 'follow-up list' }),
        description:
          'The issues the caller owns that are in review, blocked, in progress or in backlog, and the issues they follow (at most five; by default their blocked and in-review issues, newest first), each with what it waits for now and, for a followed one, how many comments and changes others made since the caller last looked at it. Needs `pm.issues` view.',
        responses: {
          200: dataResponse(FollowUpsViewSchema),
          ...apiErrorResponses,
        },
      }),
      async (context) =>
        context.json({
          data: await followUps.overview(await viewerOf(context)),
        }),
    );

    routes.put(
      '/following',
      describeRoute({
        tags,
        summary: 'Replace the issues I follow',
        operationId: 'followUpsSetFollowing',
        // The page's own choice, made with a star; `follow-up list` reads it.
        ...cliRoute(false),
        description:
          'Replaces the issues the caller follows, in order, at most five. An issue newly followed counts what happens on it from now on. Needs `pm.issues` view.',
        responses: {
          200: dataResponse(FollowingViewSchema),
          400: apiErrorResponse(
            400,
            'An issue is not one the caller can see (`FOLLOW_UP_ISSUE_NOT_FOUND`), or there are more than five (`FOLLOW_UPS_LIMIT`).',
          ),
          ...apiErrorResponses,
        },
      }),
      apiValidator('json', FollowingInputSchema),
      async (context) =>
        context.json({
          data: await followUps.setFollowing(
            await viewerOf(context),
            context.req.valid('json').issueIds,
          ),
        }),
    );

    routes.post(
      '/issues/:issueId/markSeen',
      describeRoute({
        tags,
        summary: 'Mark an issue seen in my follow-ups',
        operationId: 'followUpsMarkSeen',
        // The page records it as the person reads; nothing a script needs.
        ...cliRoute(false),
        description:
          'Records that the caller looked at the issue now: its unread count starts again from zero. Needs `pm.issues` view.',
        responses: {
          204: emptyResponse(),
          404: apiErrorResponse(404, 'Issue not found.'),
          ...apiErrorResponses,
        },
      }),
      apiValidator('param', Params),
      async (context) => {
        await followUps.markSeen(
          await viewerOf(context),
          context.req.valid('param').issueId,
        );
        return context.body(null, 204);
      },
    );

    const root = new Hono();
    root.route('/followUps', routes);
    return root;
  });
