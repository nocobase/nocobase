/**
 * The project manager's routes (`shared/project-manager.ts`), signed in:
 *
 * - `GET /projectManager`: its settings and the agents it may run with, for anyone signed in; `PATCH /projectManager`
 *   changes them, for a manager of agents (`agents.agents` manage).
 * - `POST /projectManager/issues/{issueId}/start`: hands an open issue the project manager executes to it to go on,
 *   as the caller, who may edit the issue: "Hand over to the project manager" on an issue it never worked on.
 * - `GET /issueProgress/{issueId}`: what the issue waits for now, for whoever sees it.
 * - `GET /issueCommentRuns/{issueId}`, `POST …/continue`: an agent's comment the comment run limit held back, and
 *   continuing it (`../comment-run-limit.ts`).
 */
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import {
  projectsAccessToken,
  projectsToken,
} from '@nocobase/app-plugin-projects/server/tokens';
import { businessKey } from '@nocobase/app-plugin-projects/shared/access';
import type { Application } from '@nocobase/app-server/application';
import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono, type Context } from 'hono';
import { z } from 'zod';

import { studioError, studioErrorHandler } from '../../http/errors.js';
import { createPermissionSource } from '../commands/permissions.js';
import { continueCommentRun, pendingCommentRun } from '../comment-run-limit.js';
import { createAskerLookup } from '../conversation/acting.js';
import { callerOfRequest } from '../run-principal.js';
import { AGENT_KIND } from '../tx.js';
import { createAgentWork } from '../work.js';
import { PROJECT_MANAGER_ID } from '../../../shared/project-manager.js';
import { issueProgress } from './progress.js';
import { ProjectManagerPatchSchema } from './settings.js';
import { studioProjectManagerToken } from './token.js';
import { IssueProgressSchema, ProjectManagerViewSchema } from './schemas.js';

const tags = ['Studio'];
const Params = z.object({ issueId: z.string().min(1) });
const Input = z.object({ token: z.string().uuid() });
const PendingComment = z
  .object({
    token: z.string(),
    maxRuns: z.number(),
    windowHours: z.number(),
  })
  .nullable();

export const projectManagerRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes(({ container }) => {
    if (
      !container.has(authenticationToken) ||
      !container.has(authorizationToken) ||
      !container.has(projectsToken) ||
      !container.has(agentsToken) ||
      !container.has(studioProjectManagerToken)
    )
      return new Hono();
    const agents = container.resolve(agentsToken);
    const projects = container.resolve(projectsToken);
    const manager = container.resolve(studioProjectManagerToken);
    const permissions = createPermissionSource(
      () =>
        container.has(projectsAccessToken)
          ? container.resolve(projectsAccessToken)
          : undefined,
      createAskerLookup(agents),
    );
    /** A router of its own prefix, signed in: its middleware reaches no other route. */
    const secured = (): Hono<AuthorizationEnv> => {
      const routes = new Hono<AuthorizationEnv>();
      routes.onError(studioErrorHandler);
      routes.use(
        '*',
        container.resolve(authenticationToken).required({ scopedKeys: true }),
      );
      routes.use('*', container.resolve(authorizationToken).middleware());
      return routes;
    };
    const settings = secured();
    const progress = secured();
    const comments = secured();

    /** The caller as the projects plugin sees them, holding `action` (a business action); 403 otherwise. */
    const viewerOf = async (
      context: Context<AuthorizationEnv>,
      action: string,
    ) => {
      const identity = callerOfRequest(context as unknown as Context);
      if (!identity || !(await agents.gate.allowed(identity)).has(action))
        throw studioError(
          'PERMISSION_DENIED',
          'ACTION_FORBIDDEN',
          'This action is not allowed.',
        );
      return permissions.viewerOf(identity);
    };

    /**
     * Whether the caller manages agents (`agents.agents` manage), as the authorization context decides it: a person by
     * their roles, an API key within its scope too.
     */
    const managesAgents = async (
      context: Context<AuthorizationEnv>,
    ): Promise<boolean> => {
      const identity = callerOfRequest(context as unknown as Context);
      if (!identity || identity.kind !== 'user') return false;
      return context.get('authz').can({
        resource: { type: 'settings', id: 'agents.agents' },
        action: 'manage',
      });
    };

    const userIdOf = (context: Context<AuthorizationEnv>): string => {
      const identity = callerOfRequest(context as unknown as Context);
      if (!identity)
        throw studioError(
          'UNAUTHENTICATED',
          'UNAUTHENTICATED',
          'Sign in first.',
        );
      return identity.userId;
    };

    settings.get(
      '/',
      describeRoute({
        tags,
        summary: 'Get the project manager',
        operationId: 'projectManagerGet',
        ...cliRoute({ command: 'project-manager get' }),
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        description:
          'The project manager’s settings: the agents it runs with (a first choice and a fallback), its allocation principles (null for the built-in ones, which `builtInPrinciples` holds) and how many runs agents’ comments may start on an issue within 24 hours; with the enabled agents it may run with. Anyone signed in may read them.',
        responses: {
          200: dataResponse(ProjectManagerViewSchema),
          ...apiErrorResponses,
        },
      }),
      async (context) =>
        context.json({
          data: await manager.view(
            userIdOf(context),
            await managesAgents(context),
          ),
        }),
    );
    settings.patch(
      '/',
      describeRoute({
        tags,
        summary: 'Update the project manager',
        operationId: 'projectManagerUpdate',
        ...cliRoute({
          command: 'project-manager update',
          flags: {
            firstChoiceAgentId: { name: 'first-choice' },
            fallbackAgentId: { name: 'fallback' },
            principles: { contentFile: true },
          },
        }),
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        description:
          'Changes the agents the project manager runs with (enabled agents; the first choice also becomes the default chat agent), its allocation principles (null restores the built-in ones) and the comment run limit. Needs `agents.agents` manage.',
        responses: {
          200: dataResponse(ProjectManagerViewSchema),
          400: apiErrorResponse(
            400,
            'An agent named is not enabled, or the fallback is the first choice (`PROJECT_MANAGER_AGENT_INVALID`).',
          ),
          ...apiErrorResponses,
        },
      }),
      async (context, next) => {
        if (!(await managesAgents(context)))
          throw studioError(
            'PERMISSION_DENIED',
            'FORBIDDEN',
            'Only a manager of agents may change the project manager.',
          );
        await next();
      },
      apiValidator('json', ProjectManagerPatchSchema),
      async (context) =>
        context.json({
          data: await manager.update(
            userIdOf(context),
            context.req.valid('json'),
          ),
        }),
    );
    settings.post(
      '/issues/:issueId/start',
      describeRoute({
        tags,
        summary: 'Hand an issue to the project manager',
        operationId: 'projectManagerStartIssue',
        ...cliRoute({
          command: 'project-manager start',
          args: ['issueId'],
          flags: { issueId: { name: 'issue' } },
        }),
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        description:
          'Wakes the project manager on an open issue it executes, as the caller, to go on with it: for an issue it never worked on. Needs `pm.issues` edit on the issue.',
        responses: {
          200: dataResponse(z.object({ runId: z.string() })),
          400: apiErrorResponse(
            400,
            'The project manager does not execute the issue, the issue is not open, or the project manager cannot take work now (`PROJECT_MANAGER_NOT_STARTED`, `metadata.reason`).',
          ),
          404: apiErrorResponse(404, 'Issue not found.'),
          ...apiErrorResponses,
        },
      }),
      apiValidator('param', Params),
      async (context) => {
        const viewer = await viewerOf(context, 'pm.issues/edit');
        if (
          viewer.actor.type !== 'user' ||
          viewer.permissions.scopes[businessKey('pm.issues', 'edit')] === 'none'
        )
          throw studioError(
            'PERMISSION_DENIED',
            'ACTION_FORBIDDEN',
            'Only a person who may edit the issue may hand it over.',
          );
        const runId = await projects.tx.unit(async (tx) => {
          const issue = await projects.issueQueries.detail(
            viewer,
            context.req.valid('param').issueId,
          );
          if (
            issue.executor?.type !== AGENT_KIND ||
            issue.executor.id !== PROJECT_MANAGER_ID
          )
            throw studioError(
              'FAILED_PRECONDITION',
              'PROJECT_MANAGER_NOT_STARTED',
              'The project manager does not execute this issue.',
              { metadata: { reason: 'notManaged' } },
            );
          const attempt = await createAgentWork({
            agents,
            projects: () => projects,
          }).startNow(tx, issue, { type: 'user', id: viewer.userId });
          if (!attempt.started || !attempt.runId)
            throw studioError(
              'FAILED_PRECONDITION',
              'PROJECT_MANAGER_NOT_STARTED',
              'The project manager cannot take this issue now.',
              { metadata: { reason: attempt.skipped ?? 'unknown' } },
            );
          tx.emit({ type: 'issue.changed', issueId: issue.id });
          return attempt.runId;
        });
        return context.json({ data: { runId } });
      },
    );
    progress.get(
      '/:issueId',
      describeRoute({
        tags,
        summary: 'Get what an issue waits for',
        operationId: 'issueProgressGet',
        ...cliRoute({
          command: 'issue progress',
          args: ['issueId'],
          flags: { issueId: { name: 'issue' } },
        }),
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        description:
          'What the issue waits for now, worked out by the system: an agent working on it or queued, a pull request’s checks, a decision the project manager asked for, acceptance; with the project manager’s latest "Next" line. Needs `pm.issues` view.',
        responses: {
          200: dataResponse(IssueProgressSchema),
          404: apiErrorResponse(404, 'Issue not found.'),
          ...apiErrorResponses,
        },
      }),
      apiValidator('param', Params),
      async (context) => {
        const viewer = await viewerOf(context, 'pm.issues/view');
        const issue = await projects.issueQueries.detail(
          viewer,
          context.req.valid('param').issueId,
        );
        return context.json({
          data: await issueProgress(
            { agents, projects },
            projects.tx.read(),
            issue,
          ),
        });
      },
    );
    // The comment of an agent held back once agents' comments started as many runs as the project manager allows.
    comments.get(
      '/:issueId',
      describeRoute({
        tags,
        operationId: 'issueCommentRunsGet',
        summary: 'Get an agent comment held back by the comment run limit',
        ...cliRoute(false),
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        description:
          'Needs pm.issues/view. Returns a continuation only to a person who may edit the issue.',
        responses: {
          200: dataResponse(PendingComment),
          ...apiErrorResponses,
          404: apiErrorResponse(404, 'Issue not found.'),
        },
      }),
      apiValidator('param', Params),
      async (context) =>
        context.json({
          data: await pendingCommentRun(
            projects,
            await viewerOf(context, 'pm.issues/view'),
            context.req.valid('param').issueId,
          ),
        }),
    );
    comments.post(
      '/:issueId/continue',
      describeRoute({
        tags,
        operationId: 'issueCommentRunsContinue',
        summary: 'Continue an agent comment held back by the comment run limit',
        ...cliRoute(false),
        security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
        description:
          'Needs pm.issues/edit on the issue. Wakes the agents the comment names as the caller and restarts the count; the token is consumed once, and failed preconditions leave it pending.',
        responses: {
          200: dataResponse(z.object({ runIds: z.array(z.string()) })),
          ...apiErrorResponses,
          400: apiErrorResponse(
            400,
            'Invalid input or stale/unavailable continuation.',
          ),
          404: apiErrorResponse(404, 'Issue not found.'),
        },
      }),
      apiValidator('param', Params),
      apiValidator('json', Input),
      async (context) =>
        context.json({
          data: await continueCommentRun(
            projects,
            agents,
            await viewerOf(context, 'pm.issues/edit'),
            context.req.valid('param').issueId,
            context.req.valid('json').token,
          ),
        }),
    );
    const root = new Hono();
    root.route('/projectManager', settings);
    root.route('/issueProgress', progress);
    root.route('/issueCommentRuns', comments);
    return root;
  });
