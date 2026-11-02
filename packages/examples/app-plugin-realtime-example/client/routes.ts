import {
  defineAppRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';
import { Radio } from 'lucide-react';

const routes: readonly AppClientRouteContribution[] = [
  defineAppRoutes([
    {
      name: 'realtimeExample',
      path: '/realtime-example',
      auth: 'required',
      authz: 'skip',
      navigation: { title: 'title', icon: Radio },
      breadcrumb: { title: 'title' },
      componentLoader: () => import('./pages/business/index.js'),
      children: [
        {
          name: 'realtimeTasks',
          path: 'tasks',
          componentLoader: () => import('./pages/business/tasks.js'),
          children: [
            {
              name: 'realtimeTaskCreate',
              path: 'new',
              componentLoader: () => import('./pages/business/task-create.js'),
            },
            {
              name: 'realtimeTaskDetail',
              path: ':taskId',
              componentLoader: () => import('./pages/business/task-detail.js'),
            },
          ],
        },
        {
          name: 'realtimeInbox',
          path: 'inbox',
          componentLoader: () => import('./pages/business/inbox.js'),
          children: [
            {
              name: 'realtimeInboxTaskDetail',
              path: 'tasks/:taskId',
              componentLoader: () => import('./pages/business/task-detail.js'),
            },
          ],
        },
        {
          name: 'realtimeExports',
          path: 'exports',
          componentLoader: () => import('./pages/business/exports.js'),
        },
        {
          name: 'realtimeLab',
          path: 'lab',
          componentLoader: () => import('./pages/realtime.js'),
        },
      ],
    },
  ]),
];
export default routes;
