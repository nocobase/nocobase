import { FileText } from 'lucide-react';
import {
  defineAppRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

const routes: readonly AppClientRouteContribution[] = [
  defineAppRoutes([
    {
      name: 'template-print-example',
      path: '/template-print-example',
      auth: 'required',
      navigation: { title: 'navTitle', icon: FileText },
      breadcrumb: { title: 'navTitle' },
      authz: {
        resource: { type: 'page', id: 'example.sales.quotes' },
        action: 'access',
      },
      componentLoader: () => import('./pages/template-print-page.js'),
    },
  ]),
];

export default routes;
