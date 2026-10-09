import {
  defineAppRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';
import { Mail } from 'lucide-react';

const routes: readonly AppClientRouteContribution[] = [
  defineAppRoutes([
    {
      name: 'mailExample',
      navigation: { title: 'navigation.mailExample', icon: Mail },
      breadcrumb: { title: 'navigation.mailExample' },
      children: [
        {
          name: 'mailExampleAccounts',
          path: '/mail-example',
          auth: 'required',
          authz: 'skip',
          navigation: { title: 'navigation.accounts' },
          breadcrumb: { title: 'navigation.accounts' },
          componentLoader: () => import('./pages/mail-accounts-page.js'),
        },
        {
          name: 'mailExampleWorkspace',
          path: '/mail-example/workspace',
          auth: 'required',
          authz: 'skip',
          navigation: { title: 'navigation.workspace' },
          breadcrumb: { title: 'navigation.workspace' },
          componentLoader: () => import('./pages/mail-workspace-page.js'),
        },
        {
          name: 'mailExampleAllMessages',
          path: '/mail-example/all-mail',
          auth: 'required',
          authz: 'skip',
          navigation: { title: 'navigation.allMail' },
          breadcrumb: { title: 'navigation.allMail' },
          componentLoader: () => import('./pages/mail-all-messages-page.js'),
        },
        {
          name: 'mailExampleActivity',
          path: '/mail-example/activity',
          auth: 'required',
          authz: 'skip',
          navigation: { title: 'navigation.activity' },
          breadcrumb: { title: 'navigation.activity' },
          componentLoader: () => import('./pages/mail-activity-page.js'),
        },
        {
          name: 'mailExampleSyncLogs',
          path: '/mail-example/sync-logs',
          auth: 'required',
          authz: 'skip',
          navigation: { title: 'navigation.syncLogs' },
          breadcrumb: { title: 'navigation.syncLogs' },
          componentLoader: () => import('./pages/mail-sync-logs-page.js'),
        },
      ],
    },
  ]),
];

export default routes;
