/**
 * The browser API, mounted at `/api/projects`. Every path is behind one guard: authentication (401 for anonymous
 * callers), the authorization context, becoming a member on the first request, and the request's `Viewer`. What each
 * caller may see and change is decided by the services.
 */
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  defineApiRoutes,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import { viewerMiddleware, type ViewerEnv } from '../access/request.js';
import {
  createAttachmentRoutes,
  createIssueAttachmentRoutes,
} from '../domains/attachments/index.js';
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
import { createProjectRoutes } from '../domains/projects/index.js';
import { createSettingsRoutes } from '../domains/settings/index.js';
import { createSubscriptionRoutes } from '../domains/subscriptions/index.js';
import { createSubtaskRoutes } from '../domains/subtasks/index.js';
import { domainRouter } from '../kernel/http.js';
import {
  projectsAccessToken,
  projectsRequestActorToken,
  projectsToken,
  projectsIssueSessionToken,
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
    projects.use('*', authorization.middleware());
    projects.use('*', ensureMemberMiddleware(services.members));
    projects.use(
      '*',
      viewerMiddleware(container.resolve(projectsAccessToken), {
        actorOf: () =>
          container.has(projectsRequestActorToken)
            ? container.resolve(projectsRequestActorToken)
            : undefined,
      }),
    );
    // Every fixed segment comes before `/:projectId`, which would otherwise take it for a project id.
    projects.route('/', createMemberRoutes(services.members));
    projects.route('/', createMentionRoutes(services.commentQueries));
    projects.route(
      '/invitations',
      createInvitationRoutes(services.invitations, authentication),
    );
    projects.route('/settings', createSettingsRoutes(services.settings));
    projects.route('/labels', createLabelRoutes(services.labels));
    projects.route(
      '/attachments',
      createAttachmentRoutes(services.attachments),
    );
    projects.route('/comments', createCommentRoutes(services.comments));
    projects.route('/issues', createSubtaskRoutes(services.subtasks));
    projects.route(
      '/issues',
      createIssueCommentRoutes({
        uploadLimit: services.attachments.uploadLimit,
        comments: services.comments,
        queries: services.commentQueries,
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
        session: () =>
          container.has(projectsIssueSessionToken)
            ? container.resolve(projectsIssueSessionToken)
            : undefined,
      }),
    );
    projects.route('/', createProjectRoutes(services.projects));

    const router = new Hono();
    router.route('/projects', projects);
    return router;
  });
