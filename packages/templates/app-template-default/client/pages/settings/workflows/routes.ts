import type { AppClientRouteDefinition } from '@nocobase/app-client/plugins';
import { Workflow } from 'lucide-react';

export const workflowSettingsRoute: AppClientRouteDefinition = {
  name: 'workflowManagement',
  navigation: {
    title: 'settings.workflows.title',
    description: 'settings.workflows.description',
    icon: Workflow,
  },
  breadcrumb: { title: 'settings.workflows.title' },
  children: [
    {
      name: 'workflowDefinitions',
      path: '/workflows/definitions',
      auth: 'required',
      authz: 'unrestricted',
      navigation: { title: 'settings.workflows.definitions' },
      breadcrumb: { title: 'settings.workflows.definitions' },
      componentLoader: () => import('./definitions.js'),
    },
    {
      name: 'workflowExecutions',
      path: '/workflows/executions',
      auth: 'required',
      authz: 'unrestricted',
      navigation: { title: 'settings.workflows.executions' },
      breadcrumb: { title: 'settings.workflows.executions' },
      componentLoader: () => import('./executions.js'),
    },
  ],
};
