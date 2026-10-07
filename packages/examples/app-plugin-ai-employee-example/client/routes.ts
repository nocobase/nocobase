import { Sparkles } from 'lucide-react';
import {
  defineAppRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

// The plugin ships a fallback page that explains what to install. The application-owned Registry page
// (`registry/tasks-page`) replaces its component by the stable Route ID in `shared/contracts.ts`, so the route, its
// menu entry and its access rule stay with the plugin while the page itself belongs to the application.
const routes: readonly AppClientRouteContribution[] = [
  defineAppRoutes([
    {
      name: 'aiEmployeeExampleTasks',
      path: '/ai-employee-example',
      auth: 'required',
      authz: 'skip',
      navigation: { title: 'navigation.tasks', icon: Sparkles },
      breadcrumb: { title: 'navigation.tasks' },
      componentLoader: () => import('./pages/tasks-fallback.js'),
    },
  ]),
];

export default routes;
