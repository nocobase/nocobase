/**
 * The agents' settings pages: `agentsSettingsRoutes`, which the plugin registers as System settings › AI (Agent, Model
 * services, Runtimes, Skills, Usage, in that order), and the same pages as plain route definitions (`agentsRoute` and
 * the others) for an application that also routes one elsewhere. Each page renders its own page frame and heading,
 * and brings this plugin's translations and query cache, since it renders in the application's tree.
 *
 * Each page stands behind reading the settings item its API checks (`shared/access.ts`): Agent `agents.agents`, Model
 * services `agents.services`, Runtimes `agents.runners`, Skills `agents.skills`, Usage `agents.prices`. Without it the
 * entry is not shown; with reading alone a page shows no changing actions and the API refuses changes.
 */
import {
  defineSystemSettingsRoutes,
  SYSTEM_SETTINGS_CATEGORIES,
  SYSTEM_SETTINGS_ROUTE_PATH,
  type AppClientRouteComponentLoader,
  type AppClientRouteDefinition,
  type AppClientRoutePageDefinition,
  type AppClientSystemSettingsRoutesContribution,
} from '@nocobase/app-client/plugins';
import { Bot, BrainCircuit, ChartColumn, Server, Sparkles } from 'lucide-react';
import { createElement, type ComponentType } from 'react';

import type { SettingsItem } from '../shared/access.js';
import {
  AgentsMountContext,
  settingsMount,
  type AgentsMount,
} from './mount.js';

/** Each page stands behind reading the settings item its API checks. */
const reads = (id: SettingsItem) =>
  ({ resource: { type: 'settings', id }, action: 'read' }) as const;

/** A page module, loaded with this plugin's cache and translations. */
function withPlugin(
  load: () => Promise<{ readonly default: ComponentType }>,
): AppClientRouteComponentLoader {
  return async () => {
    const [{ default: Page }, { withAgents }] = await Promise.all([
      load(),
      import('./query.js'),
    ]);
    return { default: withAgents(Page) };
  };
}

/** `loader` with the pages told where they are mounted (`client/mount.ts`), for their links to one another. */
function mountedAt(
  mount: AgentsMount,
  loader: AppClientRouteComponentLoader,
): AppClientRouteComponentLoader {
  return async () => {
    const { default: Page } = await loader();
    function Mounted(): ReturnType<typeof createElement> {
      return createElement(
        AgentsMountContext.Provider,
        { value: mount },
        createElement(Page),
      );
    }
    return { default: Mounted };
  };
}

/** `/agents`: the agents discovered from runners, which people enable and describe. */
export const agentsRoute: AppClientRoutePageDefinition = {
  name: 'agents',
  path: '/agents',
  auth: 'required',
  authz: reads('agents.agents'),
  componentLoader: withPlugin(() => import('./pages/agents/index.js')),
};

/** `/runtimes`: the runtimes that run agents and the coding tools each reported; `connect` adds one. */
export const runtimesRoute: AppClientRoutePageDefinition = {
  name: 'runtimes',
  path: '/runtimes',
  auth: 'required',
  authz: reads('agents.runners'),
  componentLoader: withPlugin(() => import('./pages/runtimes/index.js')),
  children: [
    {
      name: 'runtimes-connect',
      path: 'connect',
      presentation: {
        kind: 'dialog',
        title: 'connect.title',
        namespace: '@nocobase/app-plugin-agents',
      },
      componentLoader: withPlugin(() => import('./pages/runtimes/connect.js')),
    },
  ],
};

/** `/skills`: the skill library; `new` and `:skillId` (covering pages). */
export const skillsRoute: AppClientRoutePageDefinition = {
  name: 'skills',
  path: '/skills',
  auth: 'required',
  authz: reads('agents.skills'),
  componentLoader: withPlugin(() => import('./pages/skills/index.js')),
  children: [
    {
      name: 'skills-new',
      path: 'new',
      presentation: { kind: 'child-page' },
      componentLoader: withPlugin(() => import('./pages/skills/new.js')),
    },
    {
      name: 'skills-detail',
      path: ':skillId',
      presentation: { kind: 'child-page' },
      componentLoader: withPlugin(
        () => import('./pages/skills/detail/index.js'),
      ),
    },
  ],
};

/** `/usage`: what agent runs used and cost, grouped and filtered; its API checks the same grant. */
export const usageRoute: AppClientRoutePageDefinition = {
  name: 'usage',
  path: '/usage',
  auth: 'required',
  authz: reads('agents.prices'),
  componentLoader: withPlugin(() => import('./pages/usage/index.js')),
};

/**
 * `/models`: the model services. It stands behind `agents.services` read rather than a page grant. The model prices are
 * the prices sheet of `/usage`, shown to who reads `agents.prices`.
 */
export const modelsRoute: AppClientRoutePageDefinition = {
  name: 'models',
  path: '/models',
  auth: 'required',
  authz: reads('agents.services'),
  componentLoader: withPlugin(() => import('./pages/models/index.js')),
};

/** Where the settings pages link an agent: the agents page beside them, which has no page per agent. */
const SETTINGS_MOUNT = settingsMount(`${SYSTEM_SETTINGS_ROUTE_PATH}/agents`);

/**
 * The agent management pages as System settings pages in the built-in AI category: `/settings/agents`,
 * `/settings/runtimes`, `/settings/skills`, `/settings/models` and `/settings/usage`, titled in this plugin's
 * namespace. The plugin registers them whatever its options; replace one with the application's
 * `routeComponentOverrides` (`@nocobase/app-plugin-agents:agents`, `:models`, `:runtimes`, `:skills`, `:usage`).
 */
export const agentsSettingsRoutes: AppClientSystemSettingsRoutesContribution =
  defineSystemSettingsRoutes([
    settingsPage(agentsRoute, 'agents.title', Bot),
    settingsPage(modelsRoute, 'models.title', BrainCircuit),
    settingsPage(runtimesRoute, 'runtimes.title', Server),
    settingsPage(skillsRoute, 'skills.title', Sparkles),
    settingsPage(usageRoute, 'usage.title', ChartColumn),
  ]);

function settingsPage(
  route: AppClientRoutePageDefinition,
  title: string,
  icon: typeof Bot,
): AppClientRoutePageDefinition {
  return {
    ...mounted(route),
    parent: SYSTEM_SETTINGS_CATEGORIES.ai,
    navigation: { title, icon },
    breadcrumb: { title },
  };
}

/** `route` and its children, each page given the settings mount. */
function mounted<T extends AppClientRouteDefinition>(route: T): T {
  const children = route.children?.map(mounted);
  if (!route.componentLoader) return children ? { ...route, children } : route;
  return {
    ...route,
    componentLoader: mountedAt(SETTINGS_MOUNT, route.componentLoader),
    ...(children ? { children } : {}),
  };
}
