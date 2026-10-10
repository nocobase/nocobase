import {
  defineAppRoutes,
  type AppClientAppRoutesContribution,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';
import { WORKFLOW_SETTING_PATHS } from './route-contracts.js';
import settings from './settings.js';

const appRoutes: AppClientAppRoutesContribution = defineAppRoutes([
  {
    name: 'workflow-detail',
    path: `${WORKFLOW_SETTING_PATHS.workflows}/:id`,
    authz: { resource: { type: 'settings', id: 'workflow' }, action: 'manage' },
    componentLoader: () =>
      import('./workflow-management/pages.js').then(
        ({ WorkflowDetailPage }) => ({ default: WorkflowDetailPage }),
      ),
  },
  {
    name: 'workflow-run-detail',
    path: `${WORKFLOW_SETTING_PATHS.workflowRuns}/:id`,
    authz: { resource: { type: 'settings', id: 'workflow' }, action: 'manage' },
    componentLoader: () =>
      import('./workflow-management/pages.js').then(
        ({ WorkflowRunDetailPage }) => ({ default: WorkflowRunDetailPage }),
      ),
  },
]);

const routes: readonly AppClientRouteContribution[] = [settings, appRoutes];

export default routes;
