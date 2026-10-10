import type { Application } from '@nocobase/app-server/application';
import type { AppRouteContribution } from '@nocobase/app-server/router';

import { accessRoutes } from '../access/routes.js';
import { ciRunRoutes } from '../builds/ci-run-routes.js';
import { buildsRoutes } from '../builds/routes.js';
import { studioAgentsRoutes } from '../agents/routes.js';
import { issueRunsRoutes } from '../agents/run-views.js';
import { stageRunRoutes } from '../agents/stage-run-routes.js';
import { gitOAuthRoutes, gitRoutes, gitWebhookRoutes } from '../git/routes.js';
import { inboxRoutes } from '../inbox/routes.js';
import { knowledgeViewRoutes } from '../knowledge/routes.js';
import { knowledgeSearchRoutes } from '../knowledge/search-routes.js';
import { previewsRoutes } from '../previews/routes.js';
import { projectInitsRoutes } from '../projects-init/routes.js';
import { releasesRoutes } from '../releases/routes.js';
import { reportsRoutes } from '../reports/routes.js';

const routes: readonly AppRouteContribution<Application>[] = [
  accessRoutes,
  inboxRoutes,
  studioAgentsRoutes,
  issueRunsRoutes,
  stageRunRoutes,
  reportsRoutes,
  releasesRoutes,
  ciRunRoutes,
  gitRoutes,
  gitWebhookRoutes,
  gitOAuthRoutes,
  previewsRoutes,
  projectInitsRoutes,
  buildsRoutes,
  knowledgeSearchRoutes,
  knowledgeViewRoutes,
];

export default routes;
