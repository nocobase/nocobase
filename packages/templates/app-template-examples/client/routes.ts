import {
  FileText,
  Home,
  Hash,
  Languages,
  PanelsTopLeft,
  Plug,
  Workflow,
} from 'lucide-react';
import {
  defineAppRoutes,
  defineSettingsRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

const appRoutes: AppClientRouteContribution = defineAppRoutes([
  {
    // Every signed-in user reaches the landing page. `authz: 'skip'` takes it out of page authorization entirely, so
    // no permission change can leave a user signed in with nowhere to land.
    authz: 'skip',
    auth: 'required',
    componentLoader: () => import('./pages/home.js'),
    name: 'home',
    navigation: { title: 'navigation.home', icon: Home },
    path: '/',
  },
  {
    // The header bell is where a user looks for unread items, so this page is reached from there. Declaring no
    // navigation keeps a second menu entry from pointing at the one destination the bell already owns.
    authz: 'skip',
    auth: 'required',
    componentLoader: () => import('./pages/notifications.js'),
    name: 'notifications',
    path: '/notifications',
  },
  {
    auth: 'required',
    name: 'routeOverlays',
    path: '/route-overlays',
    navigation: { title: 'navigation.routeOverlays', icon: PanelsTopLeft },
    breadcrumb: { title: 'navigation.routeOverlays' },
    authz: {
      resource: { type: 'page', id: 'routeOverlays' },
      action: 'access',
    },
    componentLoader: () => import('./pages/route-overlays/index.js'),
    children: [
      {
        name: 'routeDialogExample',
        path: 'dialog',
        authz: 'skip',
        componentLoader: () => import('./pages/route-overlays/dialog/index.js'),
        children: [
          {
            name: 'routeDialogDrawerExample',
            path: 'drawer',
            authz: 'skip',
            componentLoader: () =>
              import('./pages/route-overlays/dialog/drawer.js'),
          },
        ],
      },
      {
        name: 'routeDrawerExample',
        path: 'drawer',
        authz: 'skip',
        componentLoader: () => import('./pages/route-overlays/drawer/index.js'),
        children: [
          {
            name: 'routeDrawerDialogExample',
            path: 'dialog',
            authz: 'skip',
            componentLoader: () =>
              import('./pages/route-overlays/drawer/dialog.js'),
          },
        ],
      },
      // The overlays above name no destination and stay out of the breadcrumb. These are pages, so each declares a
      // title and adds a level to the trail — which is the contrast the page is there to show.
      {
        name: 'routeChildPages',
        path: 'pages',
        breadcrumb: { title: 'routeOverlays.childPagesTitle' },
        authz: 'skip',
        componentLoader: () => import('./pages/route-overlays/pages/index.js'),
        children: [
          {
            name: 'routeChildPageQuotation',
            path: 'quotation',
            breadcrumb: { title: 'routeOverlays.topicQuotation' },
            authz: 'skip',
            componentLoader: () =>
              import('./pages/route-overlays/pages/quotation/index.js'),
            children: [
              // An overlay below a page. It names no destination, so the trail stops at the page above it.
              {
                name: 'routeChildPageDialog',
                path: 'dialog',
                authz: 'skip',
                componentLoader: () =>
                  import('./pages/route-overlays/pages/quotation/dialog.js'),
              },
            ],
          },
          {
            name: 'routeChildPageOnboarding',
            path: 'onboarding',
            breadcrumb: { title: 'routeOverlays.topicOnboarding' },
            authz: 'skip',
            componentLoader: () =>
              import('./pages/route-overlays/pages/onboarding.js'),
          },
          {
            name: 'routeChildPageRenewal',
            path: 'renewal',
            breadcrumb: { title: 'routeOverlays.topicRenewal' },
            authz: 'skip',
            componentLoader: () =>
              import('./pages/route-overlays/pages/renewal.js'),
          },
        ],
      },
    ],
  },
  {
    auth: 'required',
    authz: 'skip',
    componentLoader: () => import('./pages/articles.js'),
    name: 'articles',
    navigation: { title: 'navigation.articles', icon: FileText },
    path: '/articles',
  },
  {
    auth: 'required',
    name: 'workflowExamples',
    path: '/workflow',
    navigation: { title: 'navigation.workflow', icon: Workflow },
    children: [
      {
        auth: 'required',
        authz: 'skip',
        name: 'workflowWaitingTasks',
        path: 'waiting-tasks',
        navigation: { title: 'navigation.workflowWaitingTasks' },
        breadcrumb: { title: 'navigation.workflowWaitingTasks' },
        componentLoader: () =>
          import('./pages/workflow-waiting-tasks/index.js'),
      },
      {
        auth: 'required',
        authz: 'skip',
        name: 'workflowWaitingTask',
        path: 'waiting-tasks/:id',
        breadcrumb: { title: 'workflowTasks.detailTitle' },
        componentLoader: () => import('./pages/workflow-waiting-tasks/task.js'),
      },
    ],
  },
  {
    auth: 'required',
    authz: {
      resource: { type: 'page', id: 'numeric-examples' },
      action: 'access',
    },
    componentLoader: () => import('./pages/numeric-examples.js'),
    name: 'numeric-examples',
    navigation: { title: 'navigation.numbers', icon: Hash },
    path: '/numeric-examples',
  },
  {
    auth: 'required',
    authz: {
      resource: { type: 'page', id: 'i18n-examples' },
      action: 'access',
    },
    componentLoader: () => import('./pages/i18n-examples/index.js'),
    name: 'i18n-examples',
    navigation: { title: 'navigation.i18nExamples', icon: Languages },
    path: '/i18n-examples',
  },
  {
    auth: 'required',
    authz: { resource: { type: 'page', id: 'external-crm' }, action: 'access' },
    componentLoader: () => import('./pages/external-crm.js'),
    name: 'external-crm',
    navigation: { title: 'navigation.externalCrm', icon: Plug },
    path: '/external-crm',
  },
  {
    auth: 'guest',
    authz: 'skip',
    componentLoader: () => import('./pages/auth/login.js'),
    name: 'login',
    path: '/login',
  },
  {
    auth: 'guest',
    authz: 'skip',
    componentLoader: () => import('./pages/auth/register.js'),
    name: 'register',
    path: '/register',
  },
  {
    auth: 'guest',
    authz: 'skip',
    componentLoader: () => import('./pages/auth/forgot-password.js'),
    name: 'forgot-password',
    path: '/forgot-password',
  },
  {
    auth: 'guest',
    authz: 'skip',
    componentLoader: () => import('./pages/auth/reset-password.js'),
    name: 'reset-password',
    path: '/reset-password',
  },
]);

const settingsRoutes: AppClientRouteContribution = defineSettingsRoutes([]);

const routes: readonly AppClientRouteContribution[] = [
  appRoutes,
  settingsRoutes,
];

export default routes;
