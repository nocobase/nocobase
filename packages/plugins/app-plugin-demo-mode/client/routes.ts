import {
  defineAppRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

import { DEMO_SIGN_IN_PATH } from './accounts.js';

/**
 * The demo's quick sign-in page. Optional rather than guest, so a signed-in visitor can switch accounts there too; the
 * server lists nothing when the application is not a demo.
 */
const routes: AppClientRouteContribution = defineAppRoutes([
  {
    name: 'demo-sign-in',
    path: DEMO_SIGN_IN_PATH,
    auth: 'optional',
    authz: 'skip',
    componentLoader: () => import('./pages/demo-sign-in.js'),
  },
]);

export default routes;
