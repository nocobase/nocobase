import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  defineRootRoutes,
  type AppRootRouteContribution,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import { renderRealtimePage } from '../realtime-page.js';
import { apiRoutes } from './api.js';

export const rootRoutes: AppRootRouteContribution<AppPluginApplication> =
  defineRootRoutes(() => {
    const router = new Hono();
    router.get('/realtime', (context) => context.html(renderRealtimePage()));
    return router;
  });

const routes: readonly AppRouteContribution<AppPluginApplication>[] = [
  rootRoutes,
  apiRoutes,
];

export default routes;
