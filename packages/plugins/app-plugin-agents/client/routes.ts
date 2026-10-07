/**
 * The agent team pages as route definitions, for the application to route (the plugin registers no routes of its
 * own): `/agents`, `/runtimes` and `/skills`, each with its dialog and detail children, and `/usage`. Each page renders its own page
 * frame and heading, and brings this plugin's translations and query cache, since it renders in the application's
 * tree. The application gives each top-level page its own `navigation` and `breadcrumb`.
 *
 * Each page stands behind its own page grant (`shared/access.ts` `PAGES`, named like the route), which only opens it:
 * what a page lists and changes is decided by the API on the settings items (`agents.agents`, `agents.runners`), and
 * on the runtimes page by who added each runtime.
 */
import type {
  AppClientRouteComponentLoader,
  AppClientRoutePageDefinition,
} from '@nocobase/app-client/plugins';
import type { ComponentType } from 'react';

import type { Page } from '../shared/access.js';

const page = (id: Page) =>
  ({ resource: { type: 'page', id }, action: 'access' }) as const;

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

/** `/agents`: the agents people assign work to; `new` (dialog) and `:agentId` (covering page). */
export const agentsRoute: AppClientRoutePageDefinition = {
  name: 'agents',
  path: '/agents',
  auth: 'required',
  authz: page('agents'),
  componentLoader: withPlugin(() => import('./pages/agents/index.js')),
  children: [
    {
      name: 'agents-new',
      path: 'new',
      componentLoader: withPlugin(() => import('./pages/agents/new.js')),
    },
    {
      name: 'agents-detail',
      path: ':agentId',
      componentLoader: withPlugin(
        () => import('./pages/agents/detail/index.js'),
      ),
    },
  ],
};

/** `/runtimes`: the runtimes that run agents and the coding tools each reported; `connect` adds one. */
export const runtimesRoute: AppClientRoutePageDefinition = {
  name: 'runtimes',
  path: '/runtimes',
  auth: 'required',
  authz: page('runtimes'),
  componentLoader: withPlugin(() => import('./pages/runtimes/index.js')),
  children: [
    {
      name: 'runtimes-connect',
      path: 'connect',
      componentLoader: withPlugin(() => import('./pages/runtimes/connect.js')),
    },
  ],
};

/** `/skills`: the skill library; `new` and `:skillId` (covering pages). */
export const skillsRoute: AppClientRoutePageDefinition = {
  name: 'skills',
  path: '/skills',
  auth: 'required',
  authz: page('skills'),
  componentLoader: withPlugin(() => import('./pages/skills/index.js')),
  children: [
    {
      name: 'skills-new',
      path: 'new',
      componentLoader: withPlugin(() => import('./pages/skills/new.js')),
    },
    {
      name: 'skills-detail',
      path: ':skillId',
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
  authz: page('usage'),
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
  authz: {
    resource: { type: 'settings', id: 'agents.services' },
    action: 'read',
  },
  componentLoader: withPlugin(() => import('./pages/models/index.js')),
};
