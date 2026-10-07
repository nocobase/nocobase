/**
 * The browser API, mounted at `/api/projects`. Every path is behind one guard: authentication (401 for anonymous
 * callers), the authorization context, becoming a member on the first request, and the request's `Viewer`. What each
 * caller may see and change is decided by the services.
 */
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  ApiError,
  defineApiRoutes,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import { viewerMiddleware, type ViewerEnv } from '../access/request.js';
import { createApprovalRoutes } from '../domains/approvals/index.js';
import {
  createAttachmentRoutes,
  createIssueAttachmentRoutes,
} from '../domains/attachments/index.js';
import { createChecklistRoutes } from '../domains/checklists/index.js';
import {
  createCommentRoutes,
  createIssueCommentRoutes,
  createMentionRoutes,
} from '../domains/comments/index.js';
import { createInvitationRoutes } from '../domains/invitations/index.js';
import { createIssueRoutes } from '../domains/issues/index.js';
import { createLabelRoutes } from '../domains/labels/index.js';
import {
  createMemberRoutes,
  ensureMemberMiddleware,
} from '../domains/members/index.js';
import { createPlanRoutes } from '../domains/plans/index.js';
import { createIntakeRoutes } from '../domains/plans/intake/index.js';
import { createProjectRoutes } from '../domains/projects/index.js';
import { createSettingsRoutes } from '../domains/settings/index.js';
import { createSubscriptionRoutes } from '../domains/subscriptions/index.js';
import { createSubtaskRoutes } from '../domains/subtasks/index.js';
import { createWorkflowRoutes } from '../domains/workflows/index.js';
import { domainRouter, PROJECTS_DOMAIN } from '../kernel/http.js';
import {
  projectsAccessToken,
  projectsDelegatedWritesToken,
  projectsPlanSourceToken,
  projectsRequestActorToken,
  projectsToken,
} from '../tokens.js';

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes((app) => {
    const { container } = app;
    const authentication = container.resolve(authenticationToken);
    const authorization = container.resolve(authorizationToken);
    const services = container.resolve(projectsToken);

    const projects = domainRouter<ViewerEnv>();
    // Scoped API keys are welcome: every endpoint decides through the request's Viewer, whose permissions the
    // application narrows to the key's scope and whose projects follow the key's selection (`viewerMiddleware`).
    projects.use('*', authentication.required({ scopedKeys: true }));
    // Intake and plans are a person's conversation with their agents: a person signs in for them. An issued credential
    // (an agent's run token) passes: it reaches only the plan routes whose security lists it (`plan.routes.ts`).
    for (const personal of ['/intake', '/intake/*', '/plans', '/plans/*'])
      projects.use(personal, async (context, next) => {
        const auth = context.get('auth');
        if (
          auth &&
          !auth.credential &&
          (await authentication.isScopedSession(auth, context.req.raw))
        )
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            reason: 'SCOPED_KEY_FORBIDDEN',
            domain: PROJECTS_DOMAIN,
            message:
              'Intake and plans are for people; a scoped key or an organization’s API key cannot use them.',
          });
        await next();
      });
    projects.use('*', authorization.middleware());
    projects.use('*', ensureMemberMiddleware(services.members));
    projects.use(
      '*',
      viewerMiddleware(container.resolve(projectsAccessToken), {
        actorOf: () =>
          container.has(projectsRequestActorToken)
            ? container.resolve(projectsRequestActorToken)
            : undefined,
        delegated: () =>
          container.has(projectsDelegatedWritesToken)
            ? container.resolve(projectsDelegatedWritesToken)
            : undefined,
      }),
    );
    // Every fixed segment comes before `/:projectId`, which would otherwise take it for a project id.
    projects.route('/', createMemberRoutes(services.members));
    projects.route('/', createMentionRoutes(services.commentQueries));
    projects.route(
      '/invitations',
      createInvitationRoutes(services.invitations),
    );
    projects.route('/settings', createSettingsRoutes(services.settings));
    projects.route('/labels', createLabelRoutes(services.labels));
    projects.route('/workflows', createWorkflowRoutes(services.workflows));
    projects.route('/approvals', createApprovalRoutes(services.approvals));
    projects.route(
      '/plans',
      createPlanRoutes(services.plans, {
        sourceOf: () =>
          container.has(projectsPlanSourceToken)
            ? container.resolve(projectsPlanSourceToken)
            : undefined,
      }),
    );
    projects.route(
      '/intake',
      createIntakeRoutes(services.intake, services.intakeAi),
    );
    projects.route(
      '/attachments',
      createAttachmentRoutes(services.attachments),
    );
    projects.route('/comments', createCommentRoutes(services.comments));
    projects.route('/issues', createChecklistRoutes(services.checklists));
    projects.route('/issues', createSubtaskRoutes(services.subtasks));
    projects.route(
      '/issues',
      createIssueCommentRoutes({
        comments: services.comments,
        queries: services.commentQueries,
        read: () => services.tx.read(),
      }),
    );
    projects.route('/issues', createSubscriptionRoutes(services.subscriptions));
    projects.route(
      '/issues',
      createIssueAttachmentRoutes(services.attachments),
    );
    projects.route(
      '/issues',
      createIssueRoutes({
        issues: services.issues,
        queries: services.issueQueries,
      }),
    );
    projects.route('/', createProjectRoutes(services.projects));

    const router = new Hono();
    router.route('/projects', projects);
    return router;
  });
