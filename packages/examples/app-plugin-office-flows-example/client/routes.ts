import {
  Calendar,
  ClipboardList,
  Database,
  Inbox,
  Workflow,
} from 'lucide-react';
import {
  defineAppRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

const routes: readonly AppClientRouteContribution[] = [
  defineAppRoutes([
    {
      name: 'officeFlowsExample',
      navigation: { title: 'navigation.group', icon: Workflow },
      breadcrumb: { title: 'navigation.group' },
      children: [
        {
          name: 'officeFlowsDataRequests',
          path: '/office-flows/data-requests',
          auth: 'required',
          authz: 'skip',
          navigation: { title: 'navigation.dataRequests', icon: Database },
          breadcrumb: { title: 'navigation.dataRequests' },
          componentLoader: () => import('./pages/data-requests.js'),
        },
        {
          name: 'officeFlowsIncoming',
          path: '/office-flows/incoming',
          auth: 'required',
          authz: 'skip',
          navigation: { title: 'navigation.incoming', icon: Inbox },
          breadcrumb: { title: 'navigation.incoming' },
          componentLoader: () => import('./pages/incoming.js'),
        },
        {
          name: 'officeFlowsTasks',
          path: '/office-flows/tasks',
          auth: 'required',
          authz: 'skip',
          navigation: { title: 'navigation.tasks', icon: ClipboardList },
          breadcrumb: { title: 'navigation.tasks' },
          componentLoader: () => import('./pages/tasks.js'),
        },
        {
          name: 'officeFlowsConfiguration',
          path: '/office-flows/configuration',
          auth: 'required',
          authz: 'skip',
          navigation: { title: 'navigation.configuration', icon: Calendar },
          breadcrumb: { title: 'navigation.configuration' },
          componentLoader: () => import('./pages/configuration.js'),
        },
      ],
    },
  ]),
];

export default routes;
