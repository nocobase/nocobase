import {
  defineSystemSettingsRoutes,
  SYSTEM_SETTINGS_CATEGORIES,
  type AppClientSystemSettingsRoutesContribution,
} from '@nocobase/app-client/plugins';
import { Network } from 'lucide-react';

import { DISTRIBUTED_STATUS_ACCESS } from '../shared/types.js';

/** The route an application replaces with `statusComponentLoader` or its own `routeComponentOverrides`. */
export const DISTRIBUTED_STATUS_ROUTE_ID =
  '@nocobase/app-plugin-distributed:distributedStatus';

/**
 * The status page under System settings › System. It declares the same page grant the server checks, so the role
 * editor offers it and a role without it sees neither the entry nor the data.
 */
const routes: AppClientSystemSettingsRoutesContribution =
  defineSystemSettingsRoutes([
    {
      parent: SYSTEM_SETTINGS_CATEGORIES.system,
      name: 'distributedStatus',
      path: '/distributed',
      auth: 'required',
      authz: DISTRIBUTED_STATUS_ACCESS,
      navigation: {
        title: 'nav.title',
        description: 'nav.description',
        icon: Network,
        relatedSettings: ['snowflakeWorker'],
      },
      breadcrumb: { title: 'nav.title' },
      componentLoader: () => import('./components/status-page.js'),
      children: [
        {
          name: 'distributedConfiguration',
          path: 'configuration',
          componentLoader: async () => ({
            default: (await import('./components/status-page.js'))
              .Configuration,
          }),
        },
        {
          name: 'distributedChecks',
          path: 'checks',
          componentLoader: async () => ({
            default: (await import('./components/status-page.js')).Checks,
          }),
        },
      ],
    },
  ]);

export default routes;
