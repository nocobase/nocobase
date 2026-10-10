import {
  FileDown,
  Receipt,
  Repeat,
  ShoppingCart,
  Ticket,
  Truck,
  Workflow,
  Zap,
} from 'lucide-react';
import {
  defineAppRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

const routes: readonly AppClientRouteContribution[] = [
  defineAppRoutes([
    {
      name: 'lifecycleExample',
      navigation: { title: 'navigation.group', icon: Workflow },
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
        // Processes that stop to wait for the outside and are moved on by it.
        {
          name: 'lifecycleExampleOrders',
          path: '/lifecycle-example/orders',
          auth: 'required',
          authz: 'skip',
          navigation: { title: 'navigation.orders', icon: ShoppingCart },
          breadcrumb: { title: 'navigation.orders' },
          componentLoader: () => import('./pages/orders.js'),
        },
        {
          name: 'lifecycleExampleExports',
          path: '/lifecycle-example/exports',
          auth: 'required',
          authz: 'skip',
          navigation: { title: 'navigation.exports', icon: FileDown },
          breadcrumb: { title: 'navigation.exports' },
          componentLoader: () => import('./pages/exports.js'),
        },
        {
          name: 'lifecycleExamplePurchases',
          path: '/lifecycle-example/purchases',
          auth: 'required',
          authz: 'skip',
          navigation: { title: 'navigation.purchases', icon: Zap },
          breadcrumb: { title: 'navigation.purchases' },
          componentLoader: () => import('./pages/purchases.js'),
        },
        {
          name: 'lifecycleExampleFulfilments',
          path: '/lifecycle-example/fulfilments',
          auth: 'required',
          authz: 'skip',
          navigation: { title: 'navigation.fulfilments', icon: Truck },
          breadcrumb: { title: 'navigation.fulfilments' },
          componentLoader: () => import('./pages/fulfilments.js'),
        },
        {
          name: 'lifecycleExampleSubscriptions',
          path: '/lifecycle-example/subscriptions',
          auth: 'required',
          authz: 'skip',
          navigation: { title: 'navigation.subscriptions', icon: Repeat },
          breadcrumb: { title: 'navigation.subscriptions' },
          componentLoader: () => import('./pages/subscriptions.js'),
        },
      ],
    },
  ]),
];

export default routes;
