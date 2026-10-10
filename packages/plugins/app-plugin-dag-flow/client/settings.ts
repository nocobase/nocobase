import {
  defineSettingsRoutes,
  type AppClientSettingsRoutesContribution,
} from '@nocobase/app-client/plugins';
import { Workflow as WorkflowIcon, Zap } from 'lucide-react';

const settings: AppClientSettingsRoutesContribution = defineSettingsRoutes([
  {
    name: 'automation',

    navigation: { title: 'nav.automation', icon: Zap },
    breadcrumb: { title: 'nav.automation' },
    children: [
      {
        name: 'workflows',
        path: '/workflow',
        navigation: { title: 'nav.workflows', icon: WorkflowIcon },
        breadcrumb: { title: 'nav.workflows' },
        authz: {
          resource: { type: 'settings', id: 'workflow' },
          action: 'manage',
        },
        componentLoader: () =>
          import('./workflow-management/pages.js').then(
            ({ WorkflowManagementPage }) => ({
              default: WorkflowManagementPage,
            }),
          ),
        children: [
          {
            name: 'workflow-flows',
            path: 'workflows',
            authz: {
              resource: { type: 'settings', id: 'workflow' },
              action: 'manage',
            },
            componentLoader: () =>
              import('./workflow-management/pages.js').then(
                ({ WorkflowListPage }) => ({ default: WorkflowListPage }),
              ),
          },
          {
            name: 'workflow-runs',
            path: 'runs',
            authz: {
              resource: { type: 'settings', id: 'workflow' },
              action: 'manage',
            },
            componentLoader: () =>
              import('./workflow-management/pages.js').then(
                ({ WorkflowRunListPage }) => ({ default: WorkflowRunListPage }),
              ),
          },
        ],
      },
    ],
  },
]);

export default settings;
