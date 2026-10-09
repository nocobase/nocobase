import {
  defineDevRoutes,
  defineSettingsRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';
import { Mail, Users } from 'lucide-react';

const routes: readonly AppClientRouteContribution[] = [
  defineSettingsRoutes([
    {
      name: 'mail',
      path: '/mail',
      navigation: { title: 'nav.settings', icon: Mail },
      children: [
        {
          name: 'accounts',
          path: '/accounts',
          navigation: { title: 'nav.accounts', icon: Users },
          authz: {
            resource: { type: 'page', id: 'mail.admin' },
            action: 'access',
          },
          componentLoader: () => import('./pages/mail-settings-page.js'),
        },
      ],
    },
  ]),
  defineDevRoutes([
    {
      name: 'mail',
      path: '/mail',
      navigation: { title: 'nav.dev', icon: Mail },
      children: [
        {
          name: 'accounts',
          path: '/accounts',
          navigation: { title: 'nav.devAccounts' },
          authz: {
            resource: { type: 'page', id: 'mail.workspace' },
            action: 'access',
          },
          componentLoader: () => import('./pages/mail-accounts-dev-page.js'),
        },
        {
          name: 'center',
          path: '/center',
          navigation: { title: 'nav.devCenter' },
          authz: {
            resource: { type: 'page', id: 'mail.workspace' },
            action: 'access',
          },
          componentLoader: () =>
            import('./pages/mail-dev-page.js').then(
              ({ MailCenterDevPage }) => ({
                default: MailCenterDevPage,
              }),
            ),
        },
        {
          name: 'management',
          path: '/management',
          navigation: { title: 'nav.devManagement' },
          authz: {
            resource: { type: 'page', id: 'mail.management' },
            action: 'access',
          },
          componentLoader: () => import('./pages/mail-management-page.js'),
        },
        {
          name: 'send',
          path: '/send',
          navigation: { title: 'nav.devSend' },
          authz: {
            resource: { type: 'page', id: 'mail.workspace' },
            action: 'access',
          },
          componentLoader: () =>
            import('./pages/mail-dev-hub-page.js').then(
              ({ MailSendHubPage }) => ({ default: MailSendHubPage }),
            ),
          children: [
            {
              name: 'compose',
              path: 'compose',
              componentLoader: () =>
                import('./pages/mail-dev-hub-page.js').then(
                  ({ MailComposeRedirect }) => ({
                    default: MailComposeRedirect,
                  }),
                ),
            },
            {
              name: 'bulk',
              path: 'bulk',
              componentLoader: () =>
                import('./pages/mail-dev-hub-page.js').then(
                  ({ MailComposeRedirect }) => ({
                    default: MailComposeRedirect,
                  }),
                ),
            },
          ],
        },
        {
          name: 'logs',
          path: '/logs',
          navigation: { title: 'nav.devLogs' },
          authz: {
            resource: { type: 'page', id: 'mail.workspace' },
            action: 'access',
          },
          componentLoader: () =>
            import('./pages/mail-dev-hub-page.js').then(
              ({ MailLogsHubPage }) => ({ default: MailLogsHubPage }),
            ),
          children: [
            {
              name: 'send',
              path: 'send',
              componentLoader: () => import('./pages/mail-send-logs-page.js'),
            },
            {
              name: 'bulk',
              path: 'bulk',
              componentLoader: () =>
                import('./pages/mail-dev-hub-page.js').then(
                  ({ MailBulkLogsPage }) => ({ default: MailBulkLogsPage }),
                ),
            },
            {
              name: 'sync',
              path: 'sync',
              componentLoader: () => import('./pages/mail-sync-logs-page.js'),
            },
          ],
        },
        {
          name: 'bulk-send',
          path: '/bulk-send',
          authz: {
            resource: { type: 'page', id: 'mail.workspace' },
            action: 'access',
          },
          componentLoader: () =>
            import('./pages/mail-dev-hub-page.js').then(
              ({ MailBulkSendRedirect }) => ({ default: MailBulkSendRedirect }),
            ),
        },
        {
          name: 'sync-logs',
          path: '/sync-logs',
          authz: {
            resource: { type: 'page', id: 'mail.workspace' },
            action: 'access',
          },
          componentLoader: () =>
            import('./pages/mail-dev-hub-page.js').then(
              ({ MailSyncLogsRedirect }) => ({ default: MailSyncLogsRedirect }),
            ),
        },
        {
          name: 'send-logs',
          path: '/send-logs',
          authz: {
            resource: { type: 'page', id: 'mail.workspace' },
            action: 'access',
          },
          componentLoader: () =>
            import('./pages/mail-dev-hub-page.js').then(
              ({ MailSendLogsRedirect }) => ({ default: MailSendLogsRedirect }),
            ),
        },
      ],
    },
  ]),
];

export default routes;
