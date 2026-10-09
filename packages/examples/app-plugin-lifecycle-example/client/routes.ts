import { Receipt, RefreshCcw, Ticket } from 'lucide-react';
import {
  defineAppRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

const routes: readonly AppClientRouteContribution[] = [
  defineAppRoutes([
    {
      name: 'lifecycleExample',
      navigation: { title: 'navigation.group', icon: RefreshCcw },
      breadcrumb: { title: 'navigation.group' },
      children: [
        {
          name: 'lifecycleExampleTickets',
          path: '/lifecycle-example/tickets',
          auth: 'required',
          authz: 'skip',
          navigation: { title: 'navigation.tickets', icon: Ticket },
          breadcrumb: { title: 'navigation.tickets' },
          componentLoader: () => import('./pages/tickets.js'),
        },
        {
          name: 'lifecycleExampleExpenses',
          path: '/lifecycle-example/expenses',
          auth: 'required',
          authz: 'skip',
          navigation: { title: 'navigation.expenses', icon: Receipt },
          breadcrumb: { title: 'navigation.expenses' },
          componentLoader: () => import('./pages/expenses.js'),
        },
      ],
    },
  ]),
];

export default routes;
