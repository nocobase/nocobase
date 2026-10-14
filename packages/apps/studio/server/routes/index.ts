import { projectDefaultSkillsRoutes } from '../projects-init/default-skills-routes.js';
import type { Application } from '@nocobase/app-server/application';
import type { AppRouteContribution } from '@nocobase/app-server/router';

import { accessRoutes } from '../access/routes.js';
import { ownerHandoffRoutes } from '../issues/owner-handoff-routes.js';
import { taskTreeRoutes } from '../issues/task-tree-routes.js';
import { ciRunRoutes } from '../builds/ci-run-routes.js';
import { buildsRoutes } from '../builds/routes.js';
import { studioAgentsRoutes } from '../agents/routes.js';
import { issueRunsRoutes } from '../agents/run-views.js';
import { projectManagerRoutes } from '../agents/manager/routes.js';
import { followUpsRoutes } from '../follow-ups/routes.js';
import { gitOAuthRoutes, gitRoutes, gitWebhookRoutes } from '../git/routes.js';
import { inboxRoutes } from '../inbox/routes.js';
import { knowledgeViewRoutes } from '../knowledge/routes.js';
import { knowledgeSearchRoutes } from '../knowledge/search-routes.js';
import { knowledgeDirectoryRoutes } from '../knowledge/directory-routes.js';
import { previewsRoutes } from '../previews/routes.js';
import { projectInitsRoutes } from '../projects-init/routes.js';
import { releasesRoutes } from '../releases/routes.js';
import { reportsRoutes } from '../reports/routes.js';

const routes: readonly AppRouteContribution<Application>[] = [
  accessRoutes,
  ownerHandoffRoutes,
  taskTreeRoutes,
  inboxRoutes,
  studioAgentsRoutes,
  issueRunsRoutes,
  projectManagerRoutes,
  followUpsRoutes,
  reportsRoutes,
  releasesRoutes,
  ciRunRoutes,
  gitRoutes,
  gitWebhookRoutes,
  gitOAuthRoutes,
  previewsRoutes,
  projectInitsRoutes,
  projectDefaultSkillsRoutes,
  buildsRoutes,
  knowledgeSearchRoutes,
  knowledgeDirectoryRoutes,
  knowledgeViewRoutes,
];

export default routes;
