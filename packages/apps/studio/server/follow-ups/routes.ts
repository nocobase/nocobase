/**
 * `/api/followUps`, the "My follow-ups" page's data (`service.ts`, `shared/follow-ups.ts`): what the caller owns and
 * follows, what they follow, and when they last looked at an issue. Every route is the signed-in person's own and needs
 * `pm.issues` view; a scoped API key and a run are refused, as for the person's other preferences.
 *
 * - `GET /followUps`: the overview.
 * - `GET /followUps/issues?issueIds=…`: the overview's rows of the named issues, for the page to refresh only them.
 * - `GET /followUps/following`: the followed issues and how many one may follow, the follow star's read.
 * - `PUT /followUps/following`: replaces the followed issues.
 * - `POST /followUps/issues/{issueId}/follow` and `/unfollow`: adds or takes off one issue, the follow star's own.
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
  listResponse,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono, type Context } from 'hono';
import { z } from 'zod';

import { createPermissionSource } from '../agents/commands/permissions.js';
import { createAskerLookup } from '../agents/conversation/acting.js';
import { callerOfRequest } from '../agents/run-principal.js';
import { studioError, studioErrorHandler } from '../http/errors.js';
import {
  FOLLOW_UP_ROWS_MAX,
  FollowingInputSchema,
  FollowingStateSchema,
  FollowingViewSchema,
  FollowUpIssueSchema,
  FollowUpRowsMeta,
  FollowUpRowsQuery,
  FollowUpsViewSchema,
} from './schemas.js';
import { FOLLOW_UPS_MAX } from '../../shared/follow-ups.js';
import { createFollowUps } from './service.js';

const tags = ['Studio'];
const Params = z.object({ issueId: z.string().min(1) });
const IssueParams = z.object({
  issueId: z
    .string()
    .min(1)
    .meta({ description: 'The issue, by id or identifier.' }),
});

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

    routes.get(
      '/issues',
      describeRoute({
        tags,
        summary: 'List my follow-ups rows of some issues',
        operationId: 'followUpsListIssues',
        // The page refreshes the rows a change names with it; `follow-up list` reads the whole overview.
        ...cliRoute(false),
        description: `The rows \`GET /followUps\` answers for the named issues, as it would answer them now: those the caller owns in review, blocked, in progress or in backlog, and those they follow; any other issue, or one they cannot see, is left out. \`issueIds\` is a comma-separated list of at most ${FOLLOW_UP_ROWS_MAX} issue IDs. Needs \`pm.issues\` view.`,
        responses: {
          200: listResponse(FollowUpIssueSchema, FollowUpRowsMeta),
          ...apiErrorResponses,
        },
      }),
      apiValidator('query', FollowUpRowsQuery),
      async (context) => {
        const data = await followUps.rows(
          await viewerOf(context),
          context.req.valid('query').issueIds,
        );
        return context.json({ data, meta: { total: data.length } });
      },
    );

    routes.get(
      '/following',
      describeRoute({
        tags,
        summary: 'Get the issues I follow',
        operationId: 'followUpsGetFollowing',
        ...cliRoute({ command: 'follow-up following' }),
        description: `The issues the caller follows, in order, and the most one may follow (${FOLLOW_UPS_MAX}): the ones they chose, or by default their blocked and in-review issues, newest first; issues they can no longer see are left out. Needs \`pm.issues\` view.`,
        responses: {
          200: dataResponse(FollowingStateSchema),
          ...apiErrorResponses,
        },
      }),
      async (context) =>
        context.json({
          data: await followUps.following(await viewerOf(context)),
        }),
    );

    routes.put(
      '/following',
      describeRoute({
        tags,
        summary: 'Replace the issues I follow',
        operationId: 'followUpsSetFollowing',
        // Replaces the whole list; the star and the CLI use `follow-up follow` and `unfollow`.
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

    for (const verb of ['follow', 'unfollow'] as const) {
      const following = verb === 'follow';
      routes.post(
        `/issues/:issueId/${verb}`,
        describeRoute({
          tags,
          summary: following
            ? 'Follow an issue in my follow-ups'
            : 'Stop following an issue in my follow-ups',
          operationId: following
            ? 'followUpsFollowIssue'
            : 'followUpsUnfollowIssue',
          ...cliRoute({
            command: `follow-up ${verb}`,
            args: ['issueId'],
            flags: { issueId: { name: 'issue' } },
          }),
          description: following
            ? `Adds the issue to the ones the caller follows, after the others; following it already changes nothing. At most ${FOLLOW_UPS_MAX}: past that the caller unfollows one first (\`FOLLOWING_LIMIT_REACHED\`). An issue newly followed counts what happens on it from now on. \`issueId\` is an id or an identifier. Needs \`pm.issues\` view.`
            : 'Takes the issue off the ones the caller follows; not following it changes nothing. `issueId` is an id or an identifier. Needs `pm.issues` view.',
          responses: {
            200: dataResponse(FollowingViewSchema),
            ...(following
              ? {
                  400: apiErrorResponse(
                    400,
                    `The caller follows ${FOLLOW_UPS_MAX} issues already (\`FOLLOWING_LIMIT_REACHED\`).`,
                  ),
                }
              : {}),
            404: apiErrorResponse(404, 'Issue not found.'),
            ...apiErrorResponses,
          },
        }),
        apiValidator('param', IssueParams),
        async (context) => {
          const viewer = await viewerOf(context);
          const { issueId } = context.req.valid('param');
          return context.json({
            data: following
              ? await followUps.follow(viewer, issueId)
              : await followUps.unfollow(viewer, issueId),
          });
        },
      );
    }

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
