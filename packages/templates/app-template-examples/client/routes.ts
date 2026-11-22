import databaseExplorerRoutes from './pages/settings/database-explorer/routes.js';
import { includeNotificationTemplateRoutes } from './pages/settings/notification-routes.js';
import personalSettingsRoutes from './pages/me/routes.js';
import systemSettingsRoutes from './pages/settings/routes.js';
import { knowledgeDefinition } from '@nocobase/app-plugin-knowledge/client/routes';
import {
  ShoppingCart,
  Sparkles,
  ScanText,
  FileText,
  FilePenLine,
  Home,
  Hash,
  Languages,
  PanelsTopLeft,
  Plug,
  Workflow,
  BookOpen,
  DatabaseZap,
  UsersRound,
} from 'lucide-react';
import {
  defineAppRoutes,
  defineSystemSettingsRoutes,
  SYSTEM_SETTINGS_CATEGORIES,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

const appRoutes: AppClientRouteContribution = defineAppRoutes([
  {
    name: 'onboarding',
    path: '/onboarding',
    auth: 'required',
    authz: { resource: { type: 'page', id: 'onboarding' }, action: 'access' },
    navigation: { title: 'onboarding.title', icon: UsersRound },
    componentLoader: () => import('./pages/onboarding/index.js'),
    children: [
      {
        name: 'onboarding-new',
        path: 'new',
        presentation: { kind: 'child-page' },
        componentLoader: () => import('./pages/onboarding/wizard.js'),
      },
      {
        name: 'onboarding-detail',
        path: ':id',
        presentation: { kind: 'child-page' },
        componentLoader: () => import('./pages/onboarding/wizard.js'),
      },
    ],
  },
  {
    name: 'procurement',
    path: '/procurement',
    auth: 'required',
    authz: { resource: { type: 'page', id: 'procurement' }, action: 'access' },
    navigation: { title: 'procurement.title', icon: ShoppingCart },
    componentLoader: () => import('./pages/procurement/index.js'),
    children: [
      {
        name: 'procurement-new',
        path: 'new',
        presentation: { kind: 'drawer', title: 'procurement.new' },
        componentLoader: () => import('./pages/procurement/detail.js'),
      },
      {
        name: 'procurement-detail',
        path: ':id',
        presentation: { kind: 'drawer', title: 'procurement.open' },
        componentLoader: () => import('./pages/procurement/detail.js'),
      },
    ],
  },
  {
    name: 'customer-contacts',
    path: '/customer-contacts',
    auth: 'required',
    authz: {
      resource: { type: 'page', id: 'customer-contacts' },
      action: 'access',
    },
    navigation: { title: 'customerContacts.title', icon: UsersRound },
    componentLoader: () => import('./pages/customer-contacts/index.js'),
    children: [
      {
        name: 'customer-contacts-batch',
        path: 'batch',
        presentation: { kind: 'dialog', title: 'customerContacts.batchTitle' },
        componentLoader: () => import('./pages/customer-contacts/batch.js'),
      },
      {
        name: 'customer-contacts-detail',
        path: ':customerId',
        presentation: { kind: 'child-page' },
        componentLoader: () => import('./pages/customer-contacts/detail.js'),
        children: [
          {
            name: 'customer-contacts-edit',
            path: 'edit',
            presentation: {
              kind: 'dialog',
              title: 'customerContacts.editCustomer',
            },
            componentLoader: () => import('./pages/customer-contacts/edit.js'),
          },
          {
            name: 'customer-contacts-new-contact',
            path: 'contacts/new',
            presentation: {
              kind: 'dialog',
              title: 'customerContacts.newContact',
            },
            componentLoader: () => import('./pages/customer-contacts/edit.js'),
          },
          {
            name: 'customer-contacts-edit-contact',
            path: 'contacts/:contactId/edit',
            presentation: {
              kind: 'dialog',
              title: 'customerContacts.editContact',
            },
            componentLoader: () => import('./pages/customer-contacts/edit.js'),
          },
        ],
      },
    ],
  },
  {
    name: 'skill-projects',
    path: '/skill-projects',
    auth: 'required',
    authz: {
      resource: { type: 'page', id: 'skill-projects' },
      action: 'access',
    },
    navigation: { title: 'skillProjects.title', icon: FilePenLine },
    componentLoader: () => import('./pages/skill-projects/index.js'),
    children: [
      {
        name: 'skill-projects-new',
        path: 'new',
        presentation: { kind: 'dialog', title: 'skillProjects.create' },
        componentLoader: () => import('./pages/skill-projects/edit.js'),
      },
      {
        name: 'skill-projects-detail',
        path: ':projectId/details',
        breadcrumb: { title: 'skillProjects.detail' },
        componentLoader: () => import('./pages/skill-projects/detail.js'),
        children: [
          {
            name: 'skill-projects-detail-edit',
            path: 'edit',
            componentLoader: () => import('./pages/skill-projects/edit.js'),
          },
        ],
      },
      {
        name: 'skill-projects-edit',
        path: ':projectId/edit',
        presentation: { kind: 'dialog', title: 'skillProjects.edit' },
        componentLoader: () => import('./pages/skill-projects/edit.js'),
      },
    ],
  },
  {
    ...knowledgeDefinition(),
    componentLoader: () => import('./pages/knowledge/index.js'),
    // Reading and asking the knowledge base is everyday work, so it stays in the business navigation.
    navigation: { title: 'knowledge.title', icon: BookOpen },
    breadcrumb: { title: 'knowledge.title' },
  },
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
    // Declares no navigation, so the application decides where its entry goes (for example a sidebar item with an
    // unread badge). The plugin's API answers each person's own messages only, so the page needs no authorization of
    // its own.
    authz: 'skip',
    auth: 'required',
    componentLoader: () => import('./pages/inbox.js'),
    name: 'inbox',
    path: '/inbox',
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
        presentation: { kind: 'dialog', title: 'routeOverlays.dialogTitle' },
        componentLoader: () => import('./pages/route-overlays/dialog/index.js'),
        children: [
          {
            name: 'routeDialogDrawerExample',
            path: 'drawer',
            authz: 'skip',
            presentation: {
              kind: 'drawer',
              title: 'routeOverlays.drawerTitle',
            },
            componentLoader: () =>
              import('./pages/route-overlays/dialog/drawer.js'),
          },
        ],
      },
      {
        name: 'routeDrawerExample',
        path: 'drawer',
        authz: 'skip',
        presentation: { kind: 'drawer', title: 'routeOverlays.drawerTitle' },
        componentLoader: () => import('./pages/route-overlays/drawer/index.js'),
        children: [
          {
            name: 'routeDrawerDialogExample',
            path: 'dialog',
            authz: 'skip',
            presentation: {
              kind: 'dialog',
              title: 'routeOverlays.dialogTitle',
            },
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
        presentation: { kind: 'child-page' },
        componentLoader: () => import('./pages/route-overlays/pages/index.js'),
        children: [
          {
            name: 'routeChildPageQuotation',
            path: 'quotation',
            breadcrumb: { title: 'routeOverlays.topicQuotation' },
            authz: 'skip',
            presentation: { kind: 'child-page' },
            componentLoader: () =>
              import('./pages/route-overlays/pages/quotation/index.js'),
            children: [
              // An overlay below a page. It names no destination, so the trail stops at the page above it.
              {
                name: 'routeChildPageDialog',
                path: 'dialog',
                authz: 'skip',
                presentation: {
                  kind: 'dialog',
                  title: 'routeOverlays.topicDialogTitle',
                },
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
            presentation: { kind: 'child-page' },
            componentLoader: () =>
              import('./pages/route-overlays/pages/onboarding.js'),
          },
          {
            name: 'routeChildPageRenewal',
            path: 'renewal',
            breadcrumb: { title: 'routeOverlays.topicRenewal' },
            authz: 'skip',
            presentation: { kind: 'child-page' },
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
    // The AI demonstrations, which ask the Agent from a page. The Agent panel, its settings pages and the conversation
    // page come from `@nocobase/app-plugin-agents`, registered in `client/plugins.ts`.
    name: 'aiExamples',
    auth: 'required',
    navigation: { title: 'aiExamples.group', icon: Sparkles },
    children: [
      {
        name: 'ai-translation',
        path: '/ai-translation',
        authz: 'skip',
        navigation: { title: 'aiTranslation.title', icon: Languages },
        breadcrumb: { title: 'aiTranslation.title' },
        componentLoader: () => import('./pages/ai-translation/index.js'),
      },
      {
        name: 'ai-structured-extraction',
        path: '/ai-structured-extraction',
        auth: 'required',
        authz: 'skip',
        navigation: { title: 'structuredExtraction.title', icon: ScanText },
        breadcrumb: { title: 'structuredExtraction.title' },
        componentLoader: () =>
          import('./pages/ai-structured-extraction/index.js'),
      },
      {
        name: 'ai-form-fill',
        path: '/ai-form-fill',
        auth: 'required',
        // This browser-only demonstration has no business persistence or page grant.
        authz: 'skip',
        navigation: { title: 'aiFormFill.title', icon: FilePenLine },
        breadcrumb: { title: 'aiFormFill.title' },
        componentLoader: () => import('./pages/ai-form-fill/index.js'),
      },
    ],
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
  {
    // Where a command line's sign-in sends the person to approve it (`pages/auth/device.tsx`). Optional rather than
    // required so it renders outside the shell, like the sign-in pages; the page sends a guest to sign in and back.
    auth: 'optional',
    authz: 'skip',
    componentLoader: () => import('./pages/auth/device.js'),
    name: 'device',
    path: '/device',
  },
]);

// System settings, mounted under `/settings`: the home and the application's own administration modules. A module joins
// one of the categories `@nocobase/app-client` builds in with `parent`; its path is relative to `/settings`.
const settingsRoutes: AppClientRouteContribution = defineSystemSettingsRoutes([
  {
    // Opens the first page the viewer may open, so it needs no grant of its own.
    name: 'settingsHome',
    path: '/',
    auth: 'required',
    authz: 'skip',
    componentLoader: () => import('./pages/settings/settings-home.js'),
  },
  {
    // The application's own business settings, a category ahead of the built-in ones. Its pages join it with
    // `parent: 'crm'`; like every category, it stays hidden until it holds a page the viewer may open.
    name: 'crm',
    category: true,
    navigation: { title: 'settings.categories.crm', order: 50 },
    children: [],
  },
  {
    name: 'knowledgeIndexing',
    parent: SYSTEM_SETTINGS_CATEGORIES.ai,
    path: '/knowledge/indexing',
    auth: 'required',
    authz: {
      resource: { type: 'settings', id: 'kb.indexing' },
      action: 'read',
    },
    navigation: {
      title: 'knowledge.indexing',
      description: 'knowledge.indexingDescription',
      icon: DatabaseZap,
    },
    breadcrumb: { title: 'knowledge.indexing' },
    componentLoader: () => import('./pages/knowledge/indexing.js'),
  },
  {
    name: 'workflows',
    parent: SYSTEM_SETTINGS_CATEGORIES.automation,
    path: '/workflows',
    auth: 'required',
    authz: {
      resource: { type: 'settings', id: 'workflow-management' },
      action: 'read',
    },
    navigation: {
      title: 'workflows.title',
      description: 'workflows.description',
      icon: Workflow,
    },
    breadcrumb: { title: 'workflows.title' },
    componentLoader: () => import('./pages/workflows/index.js'),
    children: [
      {
        name: 'workflowDefinitions',
        path: 'definitions',
        breadcrumb: { title: 'workflows.definitions' },
        componentLoader: () => import('./pages/workflows/definitions.js'),
        children: [
          {
            name: 'workflowDefinition',
            path: ':workflowId',
            componentLoader: () => import('./pages/workflows/definition.js'),
            children: [
              {
                name: 'workflowParameters',
                path: 'parameters',
                authz: {
                  resource: { type: 'settings', id: 'workflow-management' },
                  action: 'update',
                },
                presentation: {
                  kind: 'dialog',
                  title: 'workflows.workflowParameters',
                },
                componentLoader: () =>
                  import('./pages/workflows/parameters.js'),
              },
            ],
          },
        ],
      },
      {
        name: 'workflowExecutions',
        path: 'executions',
        breadcrumb: { title: 'workflows.executions' },
        componentLoader: () => import('./pages/workflows/executions.js'),
        children: [
          {
            name: 'workflowExecution',
            path: ':workflowId/:recordId',
            componentLoader: () => import('./pages/workflows/execution.js'),
          },
        ],
      },
    ],
  },
]);

// Users and Permission management join the Accounts and permissions category; Notifications joins the System category.
// Their former URLs outside `/settings` redirect through `lib/settings-redirects.ts`.
const routes: readonly AppClientRouteContribution[] =
  includeNotificationTemplateRoutes(
    [
      appRoutes,
      settingsRoutes,
      personalSettingsRoutes,
      systemSettingsRoutes,
      databaseExplorerRoutes,
    ],
    true,
  );

export default routes;
