import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import type { AppRouteContribution } from '@nocobase/app-server/router';

import { apiRoutes } from './api.js';

const routes: readonly AppRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];

export default routes;
