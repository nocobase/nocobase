import { defineClientRouteComponentOverrides } from '@nocobase/app-client/plugins';
export default defineClientRouteComponentOverrides([
  {
    routeId: '@nocobase/app-plugin-multi-app:multiApp.templates',
    componentEntry: './client/pages/template-portal/templates',
    componentLoader: () => import('./pages/template-portal/templates.js'),
  },
  {
    routeId: '@nocobase/app-plugin-multi-app:multiApp.instances',
    componentEntry: './client/pages/template-portal/instances',
    componentLoader: () => import('./pages/template-portal/instances.js'),
  },
  {
    routeId: '@nocobase/app-plugin-multi-app:multiApp.templates.detail',
    componentEntry: './client/pages/template-portal/template-detail',
    componentLoader: () => import('./pages/template-portal/template-detail.js'),
  },
  {
    routeId: '@nocobase/app-plugin-multi-app:multiApp.instances.detail',
    componentEntry: './client/pages/template-portal/instance-detail',
    componentLoader: () => import('./pages/template-portal/instance-detail.js'),
  },
]);
