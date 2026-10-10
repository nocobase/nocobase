import {
  ShoppingBag,
  Settings2,
  Building2,
  ChartNoAxesCombined,
  PanelsTopLeft,
  SlidersHorizontal,
  MousePointer2,
  LayoutDashboard,
} from 'lucide-react';
import { defineAppRoutes } from '@nocobase/app-client/plugins';

// Only the development entry imports these routes. They expose invented, in-memory data.
export const themeLabRoutes = defineAppRoutes([
  {
    name: 'theme-lab-orders',
    path: '/theme-lab/orders',
    auth: 'required',
    authz: 'skip',
    navigation: { title: 'businessPreview.orders', icon: ShoppingBag },
    componentLoader: () => import('./orders/index.js'),
    children: [
      {
        name: 'theme-lab-order-new',
        path: 'new',
        authz: 'skip',
        componentLoader: () => import('./orders/form.js'),
      },
      {
        name: 'theme-lab-order-edit',
        path: 'edit/:orderId',
        authz: 'skip',
        componentLoader: () => import('./orders/form.js'),
      },
      {
        name: 'theme-lab-order-detail',
        path: ':orderId',
        authz: 'skip',
        componentLoader: () => import('./orders/detail.js'),
        children: [
          {
            name: 'theme-lab-order-detail-edit',
            path: 'edit',
            authz: 'skip',
            componentLoader: () => import('./orders/form.js'),
          },
        ],
      },
    ],
  },
  {
    name: 'theme-lab-workspace',
    path: '/theme-lab/workspace',
    auth: 'required',
    authz: 'skip',
    navigation: { title: 'businessPreview.workspace', icon: Settings2 },
    componentLoader: () => import('./workspace.js'),
  },
  ...(['controls', 'navigation', 'feedback'] as const).map((view) => ({
    name: `theme-lab-${view}`,
    path: `/theme-lab/${view}`,
    auth: 'required' as const,
    authz: 'skip' as const,
    navigation: {
      title: `gallery.${view}`,
      icon: {
        controls: SlidersHorizontal,
        navigation: MousePointer2,
        feedback: LayoutDashboard,
      }[view],
    },
    componentLoader: {
      controls: () => import('./controls.js'),
      navigation: () => import('./navigation.js'),
      feedback: () => import('./feedback.js'),
    }[view],
    children:
      view === 'navigation'
        ? ['dialog', 'sheet'].map((kind) => ({
            name: `theme-lab-gallery-${kind}`,
            path: kind,
            authz: 'skip' as const,
            componentLoader: () => import('./gallery-overlay.js'),
          }))
        : [],
  })),
  ...(['dashboard', 'customers', 'pipeline'] as const).map((view) => ({
    name: `theme-lab-${view}`,
    path: `/theme-lab/${view}`,
    auth: 'required' as const,
    authz: 'skip' as const,
    navigation: {
      title: `themeLab.${view}`,
      icon: {
        dashboard: ChartNoAxesCombined,
        customers: Building2,
        pipeline: PanelsTopLeft,
      }[view],
    },
    componentLoader: () => import('./index.js'),
    children: [
      ...(view === 'customers'
        ? [
            {
              name: 'theme-lab-create',
              path: 'new',
              authz: 'skip' as const,
              componentLoader: () => import('./create.js'),
            },
          ]
        : []),
      {
        name: `theme-lab-${view}-detail`,
        path: ':id',
        authz: 'skip' as const,
        componentLoader: () => import('./detail.js'),
      },
    ],
  })),
]);
