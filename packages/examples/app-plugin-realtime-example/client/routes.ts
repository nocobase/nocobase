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
      componentLoader: () => import('./pages/realtime.js'),
    },
  ]),
];
export default routes;
