import {
  defineAppRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

const routes: AppClientRouteContribution = defineAppRoutes([
  {
    name: 'index',
    path: '/routes-example',
    auth: 'required',
    authz: { resource: { type: 'page', id: 'index' }, action: 'access' },
    componentLoader: () => import('./pages/routes-example-page.js'),
  },
]);

export default routes;
