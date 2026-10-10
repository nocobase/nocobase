import { chatLinkRoutes } from '@nocobase/app-plugin-agents/client/chat';
import {
  agentsRoute,
  modelsRoute,
  runtimesRoute,
  skillsRoute,
  usageRoute,
} from '@nocobase/app-plugin-agents/client/routes';
import {
  issueChildRoutes,
  issueDetailChildRoutes,
  newIssueRoute,
  projectsRoute,
} from '@nocobase/app-plugin-projects/client/pages';
import {
  BarChart3,
  BookOpen,
  Bot,
  Boxes,
  Briefcase,
  CircleUserRound,
  Cpu,
  FolderKanban,
  House,
  LayoutDashboard,
  ListTodo,
  MonitorCog,
  Rocket,
  Server,
  Settings2,
  Sparkles,
} from 'lucide-react';
import {
  defineAppRoutes,
  type AppClientRouteContribution,
  type AppClientRouteDefinition,
} from '@nocobase/app-client/plugins';

/** `routes` with every name, at every depth, rewritten by `rename`, for a module declared under several parents. */
function renamed(
  routes: readonly AppClientRouteDefinition[],
  rename: (name: string) => string,
): AppClientRouteDefinition[] {
  return routes.map((route) =>
    route.children
      ? {
          ...route,
          name: rename(route.name),
          children: renamed(route.children, rename),
        }
      : { ...route, name: rename(route.name) },
  );
}

/**
 * An issue's covering page (`pages/issues/detail`) with the plugin's "New sub-issue" dialog (`issueDetailChildRoutes`),
 * a plan over it and a run's transcript, declared under each list that opens issues: `/issues` (no `owner`, the
 * issue's own address), the tabs of `/my-issues` and a project's Issues tab, so the issue page's trail and Back follow
 * the list it was opened from and survive a refresh (`issues/detail/issue-parent.tsx`). Route names are unique, so
 * under another list each name is prefixed with `owner`: `pm-my-issues-owned-issue-detail`.
 */
function issueDetailRoute(owner?: string): AppClientRouteDefinition {
  const name = (base: string): string =>
    owner ? `${owner}-${base.replace(/^pm-/u, '')}` : base;
  return {
    name: name('pm-issue-detail'),
    path: ':issueId',
    componentLoader: () => import('./pages/issues/detail/index.js'),
    children: [
      ...renamed(issueDetailChildRoutes, name),
      {
        // A plan opened from the issue (its related plans, an activity "via ‹Agent›'s plan"), over the issue page so
        // its trail and Back return there; the same page as `/issues/plans/:planId`.
        name: name('pm-issue-plan'),
        path: 'plans/:planId',
        componentLoader: () => import('./pages/issues/plan.js'),
      },
      {
        name: name('pm-issue-run'),
        path: 'runs/:runId',
        componentLoader: () => import('./pages/issues/detail/run-dialog.js'),
      },
    ],
  };
}

/**
 * The sidebar: Home (0, the composer that starts a conversation) and Dashboard (1), then My
 * issues (2) on top, then the sections Development (4: issues, projects, knowledge), Releases (4.5: Apps, environments)
 * and Agent team (5: agents, runtimes, skills, models, usage), and Settings (7). The inbox is the header's button
 * (`inbox/header-button.tsx`), not a sidebar entry. A section is a route without a page of its own;
 * the layout draws it as a label over its entries (`layouts/components/navigation-menu.tsx`). The projects and
 * agents plugins' pages are mounted here (`projects({ routes: false })`), so their navigation and breadcrumb titles are
 * this application's. `/issues` and `/my-issues` are this application's own pages (`pages/issues`, `pages/my-issues`),
 * composed from the projects plugin's headless issue queries and the UI Library's issue table, kanban and agent queue.
 */

/** A project's tabs (`pages/projects/detail`), each a child route of its page. */
const projectTabs = {
  overview: () => import('./pages/projects/detail/overview.js'),
  issues: () => import('./pages/projects/detail/issues.js'),
  knowledge: () => import('./pages/projects/detail/knowledge.js'),
  members: () => import('./pages/projects/detail/members.js'),
  releases: () => import('./pages/projects/detail/releases.js'),
  settings: () => import('./pages/projects/detail/settings.js'),
};

/** Release management's pages, mounted here (`releases({ routes: false })`), bound to the plugin's namespace. */
const releasesPages = () =>
  import('@nocobase/app-plugin-releases/client/pages');

/** One of release management's pages, linking to the others where they are mounted here. */
const releasesPage =
  (
    name:
      | 'ReleasesAppsPage'
      | 'ReleasesAppPage'
      | 'ReleasesNewAppPage'
      | 'ReleasesRequestPage'
      | 'EnvironmentsSettings'
      | 'ReleasesEnvironmentPage',
  ) =>
  async () => {
    const pages = await releasesPages();
    return {
      default: pages.withReleasesPaths(pages[name], {
        apps: '/releases',
        environments: '/environments',
      }),
    };
  };

const appRoutes: AppClientRouteContribution = defineAppRoutes([
  {
    // Every signed-in user reaches the landing page. `authz: 'skip'` takes it out of page authorization entirely, so
    // no permission change can leave a user signed in with nowhere to land. It is the composer that starts a
    // conversation with an agent, in Online or Runner mode (`pages/home`), first in the menu.
    authz: 'skip',
    auth: 'required',
    componentLoader: () => import('./pages/home/index.js'),
    name: 'home',
    path: '/',
    navigation: { title: 'navigation.home', icon: House, order: 0 },
  },
  {
    // How delivery goes, how the agents perform and what is stuck (`pages/dashboard`), behind the `reports` grant,
    // which the reports API checks too.
    name: 'dashboard',
    path: '/dashboard',
    auth: 'required',
    authz: { resource: { type: 'page', id: 'reports' }, action: 'access' },
    navigation: {
      title: 'navigation.dashboard',
      icon: LayoutDashboard,
      order: 1,
    },
    breadcrumb: { title: 'navigation.dashboard' },
    componentLoader: () => import('./pages/dashboard/index.js'),
  },
  {
    // One conversation, full screen (`pages/chat`): where the home page's composer and recent conversations lead, and
    // the chat panel's "Open full screen". A conversation is its owner's alone, which its API checks, so it needs no
    // page grant. No menu entry: conversations are reached from the home page, the panel and its history.
    authz: 'skip',
    auth: 'required',
    componentLoader: () => import('./pages/chat/index.js'),
    name: 'chat',
    path: '/chat/:conversationId',
  },
  {
    // Deep links into the person's own settings, a dialog over the current page (`account/account-dialog.tsx`): they
    // open it on their category. Everything there is the person's own, and every write is checked by its API, so it
    // needs no page grant.
    authz: 'skip',
    auth: 'required',
    componentLoader: () => import('./pages/account/index.js'),
    name: 'account',
    path: '/account',
    children: [
      {
        name: 'account-category',
        path: ':category',
        componentLoader: () => import('./pages/account/index.js'),
      },
    ],
  },
  {
    // Everyone's own inbox: what it lists is the viewer's, so it needs no page grant. Opened from the header's inbox
    // button, which carries the pending-decision count, so it has no sidebar entry.
    authz: 'skip',
    auth: 'required',
    componentLoader: () => import('./pages/inbox/index.js'),
    name: 'inbox',
    breadcrumb: { title: 'navigation.inbox' },
    path: '/inbox',
  },
  {
    // The issues the viewer owns or executes (`pages/my-issues`), the list by default; `owned` and `executing` tabs.
    name: 'pm-my-issues',
    path: '/my-issues',
    auth: 'required',
    authz: { resource: { type: 'page', id: 'pm-my-issues' }, action: 'access' },
    navigation: {
      title: 'navigation.myIssues',
      icon: CircleUserRound,
      order: 2,
    },
    breadcrumb: { title: 'navigation.myIssues' },
    componentLoader: () => import('./pages/my-issues/index.js'),
    children: [
      {
        name: 'pm-my-issues-owned',
        path: 'owned',
        componentLoader: () => import('./pages/my-issues/owned.js'),
        children: [issueDetailRoute('pm-my-issues-owned')],
      },
      {
        name: 'pm-my-issues-executing',
        path: 'executing',
        componentLoader: () => import('./pages/my-issues/executing.js'),
        children: [issueDetailRoute('pm-my-issues-executing')],
      },
    ],
  },
  {
    name: 'development',
    navigation: { title: 'navigation.development', icon: Briefcase, order: 4 },
    children: [
      {
        // Every issue (`pages/issues`), the Agent queue by default, hosting under it the projects plugin's "New issue"
        // dialog (`issueChildRoutes`), a plan's covering page (`pages/issues/plan`, the UI Library's plan card in place
        // of the plugin's own), and an issue's covering page (`pages/issues/detail`) with the plugin's "New sub-issue"
        // dialog (`issueDetailChildRoutes`), a plan over it and a run's transcript.
        name: 'pm-issues',
        path: '/issues',
        auth: 'required',
        authz: {
          resource: { type: 'page', id: 'pm-issues' },
          action: 'access',
        },
        navigation: { title: 'navigation.issues', icon: ListTodo },
        breadcrumb: { title: 'navigation.issues' },
        componentLoader: () => import('./pages/issues/index.js'),
        children: [
          ...issueChildRoutes.filter((child) => child.name !== 'pm-plan'),
          {
            name: 'pm-plan',
            path: 'plans/:planId',
            componentLoader: () => import('./pages/issues/plan.js'),
          },
          issueDetailRoute(),
        ],
      },
      {
        // The projects plugin's list, with a project's covering page (`pages/projects/detail`) whose tabs are its
        // children: Overview, Issues, Knowledge, Members, Releases and Settings, each hosting "New issue". Its "New
        // project" link opens Studio's new-project form (`pages/projects/new`) in place of the plugin's own form: a blank project is
        // the form's "No code".
        ...projectsRoute,
        navigation: { title: 'navigation.projects', icon: FolderKanban },
        breadcrumb: { title: 'navigation.projects' },
        children: [
          ...(projectsRoute.children ?? []).filter(
            (child) => child.name !== 'pm-project-new',
          ),
          {
            name: 'studio-project-new',
            path: 'new',
            componentLoader: () => import('./pages/projects/new/index.js'),
          },
          {
            name: 'pm-project-detail',
            path: ':projectId',
            componentLoader: () => import('./pages/projects/detail/index.js'),
            children: (
              [
                'overview',
                'issues',
                'knowledge',
                'members',
                'releases',
                'settings',
              ] as const
            ).map((tab) => ({
              name: `pm-project-${tab}`,
              path: tab,
              componentLoader: () => projectTabs[tab](),
              // The projects plugin's "New issue" dialog over the tab, the project preselected; it closes back here. The
              // Issues tab also hosts the issues opened from it.
              children: [
                {
                  ...newIssueRoute,
                  name: `pm-project-${tab}-new-issue`,
                  path: 'new-issue',
                },
                ...(tab === 'issues'
                  ? [issueDetailRoute('pm-project-issues')]
                  : []),
              ],
            })),
          },
        ],
      },
      {
        // The system's knowledge, in the knowledge plugin's view behind its `knowledge` page grant; a project's is its
        // page's Knowledge tab.
        name: 'knowledge',
        path: '/knowledge',
        auth: 'required',
        authz: {
          resource: { type: 'page', id: 'knowledge' },
          action: 'access',
        },
        navigation: { title: 'navigation.knowledge', icon: BookOpen },
        breadcrumb: { title: 'navigation.knowledge' },
        componentLoader: () => import('./pages/knowledge/index.js'),
      },
    ],
  },
  {
    // Release management: Apps and their deployments (the inbox's deployment requests open the request's dialog over its App, `/releases/:appId/requests/:requestId`) and the
    // environments they deploy to. CI uses an organization's API key with the "CI deploy" preset (Settings › API keys).
    name: 'releases',
    navigation: { title: 'navigation.releases', icon: Rocket, order: 4.5 },
    children: [
      {
        name: 'rel-apps',
        path: '/releases',
        auth: 'required',
        authz: { resource: { type: 'page', id: 'rel-apps' }, action: 'access' },
        navigation: { title: 'navigation.releaseApps', icon: Boxes },
        breadcrumb: { title: 'navigation.releaseApps' },
        componentLoader: releasesPage('ReleasesAppsPage'),
        children: [
          // Create App and a deployment request (older links), over the list; before `:appId`, which may not be `new` or `requests`.
          {
            name: 'rel-app-new',
            path: 'new',
            componentLoader: releasesPage('ReleasesNewAppPage'),
          },
          {
            name: 'rel-request',
            path: 'requests/:requestId',
            componentLoader: releasesPage('ReleasesRequestPage'),
          },
          {
            name: 'rel-app',
            path: ':appId',
            componentLoader: releasesPage('ReleasesAppPage'),
            children: [
              // The App's deployment request, over the App's page.
              {
                name: 'rel-app-request',
                path: 'requests/:requestId',
                componentLoader: releasesPage('ReleasesRequestPage'),
              },
            ],
          },
        ],
      },
      {
        name: 'rel-environments',
        path: '/environments',
        auth: 'required',
        authz: {
          resource: { type: 'settings', id: 'rel.environments' },
          action: 'read',
        },
        navigation: { title: 'navigation.environments', icon: Server },
        breadcrumb: { title: 'navigation.environments' },
        componentLoader: releasesPage('EnvironmentsSettings'),
        children: [
          {
            name: 'rel-environment',
            path: ':environmentId',
            componentLoader: releasesPage('ReleasesEnvironmentPage'),
          },
        ],
      },
    ],
  },
  {
    name: 'agent-team',
    navigation: { title: 'navigation.agentTeam', icon: Bot, order: 5 },
    children: [
      {
        ...agentsRoute,
        navigation: { title: 'navigation.agents', icon: Bot },
        breadcrumb: { title: 'navigation.agents' },
      },
      {
        ...runtimesRoute,
        navigation: { title: 'navigation.runtimes', icon: MonitorCog },
        breadcrumb: { title: 'navigation.runtimes' },
      },
      {
        ...skillsRoute,
        navigation: { title: 'navigation.skills', icon: Sparkles },
        breadcrumb: { title: 'navigation.skills' },
      },
      {
        ...modelsRoute,
        navigation: { title: 'navigation.models', icon: Cpu },
        breadcrumb: { title: 'navigation.models' },
      },
      {
        // What agent runs used and cost (the agents plugin's page and API, behind its `usage` page grant).
        ...usageRoute,
        navigation: { title: 'navigation.usage', icon: BarChart3 },
        breadcrumb: { title: 'navigation.usage' },
      },
    ],
  },
  // Legacy project manager links (`/pm`, `/pm/new`, `/pm/:id`): they open the agents' chat panel.
  ...chatLinkRoutes('/pm', 'chat-pm'),
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
    // Where `nb-studio login` sends the person to approve the CLI on their machine (`pages/auth/device.tsx`, Better Auth's
    // device authorization). Optional rather than required so it renders outside the shell, like the sign-in pages;
    // the page sends a guest to sign in and back. Everything it does is the person's own, so it needs no page grant.
    auth: 'optional',
    authz: 'skip',
    componentLoader: () => import('./pages/auth/device.js'),
    name: 'device',
    path: '/device',
  },
]);

const setting = (id: string) =>
  ({ resource: { type: 'settings', id }, action: 'read' }) as const;

/** The projects plugin's settings pages, routed here next to Studio's members and roles. */
const projectsConfig = () =>
  import('@nocobase/app-plugin-projects/client/config');

/**
 * `/config`, Studio's settings: pages that are child routes, each behind its settings item, listed by the settings
 * navigation that replaces the sidebar there. The page itself is open to every signed-in user (route authorization
 * cannot say "any of these items"); the navigation lists the pages the viewer may read.
 */
const configRoutes: AppClientRouteContribution = defineAppRoutes([
  {
    name: 'config',
    path: '/config',
    auth: 'required',
    authz: 'skip',
    navigation: { title: 'navigation.config', icon: Settings2, order: 7 },
    breadcrumb: { title: 'navigation.config' },
    componentLoader: () => import('./pages/config/index.js'),
    children: [
      {
        name: 'config-general',
        path: 'general',
        breadcrumb: { title: 'config.nav.general' },
        authz: setting('pm.general'),
        componentLoader: () => import('./pages/config/general.js'),
      },
      {
        name: 'config-members',
        path: 'members',
        breadcrumb: { title: 'config.nav.members' },
        authz: setting('pm.members'),
        componentLoader: () => import('./pages/config/members.js'),
      },
      {
        name: 'config-roles',
        path: 'roles',
        breadcrumb: { title: 'config.nav.roles' },
        authz: setting('pm.members'),
        componentLoader: () => import('./pages/config/roles.js'),
        children: [
          {
            name: 'config-role',
            path: ':roleKey',
            breadcrumb: { title: 'roles.breadcrumb' },
            componentLoader: () => import('./pages/config/role-detail.js'),
          },
        ],
      },
      {
        // The organization's API keys: their own settings item, so who manages keys is decided apart from members.
        name: 'config-api-keys',
        path: 'api-keys',
        breadcrumb: { title: 'config.nav.apiKeys' },
        authz: setting('studio.apiKeys'),
        componentLoader: () => import('./pages/config/api-keys.js'),
      },
      {
        // How the knowledge base is searched: models, contextual retrieval and whole-in-prompt.
        name: 'config-knowledge-search',
        path: 'knowledge-search',
        breadcrumb: { title: 'config.nav.knowledgeSearch' },
        authz: setting('studio.knowledgeSearch'),
        componentLoader: () => import('./pages/config/knowledge-search.js'),
      },
      {
        // The workspace's connections to code hosts: their own settings item, for administrators.
        name: 'config-git',
        path: 'git',
        breadcrumb: { title: 'config.nav.git' },
        authz: setting('studio.git'),
        componentLoader: () => import('./pages/config/git.js'),
      },
      {
        name: 'config-workflows',
        path: 'workflows',
        breadcrumb: { title: 'config.nav.workflows' },
        authz: setting('pm.workflows'),
        componentLoader: async () => ({
          default: (await projectsConfig()).WorkflowsSettings,
        }),
        children: [
          {
            name: 'config-workflow',
            path: ':workflowId',
            componentLoader: async () => ({
              default: (await projectsConfig()).WorkflowSettings,
            }),
          },
        ],
      },
      {
        name: 'config-labels',
        path: 'labels',
        breadcrumb: { title: 'config.nav.labels' },
        authz: setting('pm.labels'),
        componentLoader: async () => ({
          default: (await projectsConfig()).LabelsSettings,
        }),
      },
    ],
  },
]);

const routes: readonly AppClientRouteContribution[] = [appRoutes, configRoutes];

export default routes;
