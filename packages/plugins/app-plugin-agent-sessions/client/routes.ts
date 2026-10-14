/**
 * The agent sessions page as a route definition: `/agent-sessions` lists the viewer's sessions beside a new session,
 * and `/agent-sessions/:sessionId` opens one. A session is its owner's alone, which the API checks, so the page needs
 * no grant. An application that routes the page itself mounts `agentSessionsRoute()` with its own `navigation`.
 */
import type {
  AppClientRouteComponentLoader,
  AppClientRouteContribution,
  AppClientRoutePageDefinition,
} from '@nocobase/app-client/plugins';
import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { MessagesSquare } from 'lucide-react';
import { createElement, type ComponentType, type ReactElement } from 'react';

import type { AgentSessionsRouteOptions } from './config.js';

export type { AgentSessionsRouteOptions } from './config.js';

export function agentSessionsRoute(
  options: AgentSessionsRouteOptions,
): AppClientRoutePageDefinition {
  if (!options.cli) {
    throw new Error(
      'agentSessionsRoute() needs the application’s command line, such as { cli: "acme" }.',
    );
  }
  const page =
    (
      load: () => Promise<{ readonly default: ComponentType }>,
    ): AppClientRouteComponentLoader =>
    async () => {
      const [
        { default: Page },
        { withAgentSessions },
        { AgentSessionsConfigContext },
      ] = await Promise.all([
        load(),
        import('./query.js'),
        import('./config.js'),
      ]);
      const value = { cli: options.cli, install: options.install ?? null };
      const Configured = (): ReactElement =>
        createElement(
          AgentSessionsConfigContext.Provider,
          { value },
          createElement(Page),
        );
      return { default: withAgentSessions(Configured) };
    };
  return {
    name: 'agent-sessions',
    path: '/agent-sessions',
    auth: 'required',
    authz: 'skip',
    componentLoader: page(() => import('./pages/sessions.js')),
    children: [
      {
        name: 'agent-sessions-session',
        path: ':sessionId',
        componentLoader: page(() => import('./pages/session.js')),
      },
    ],
  };
}

/** The page with a menu entry of its own, for an application that does not route it itself. */
export function createAgentSessionsRoutes(
  options: AgentSessionsRouteOptions,
): readonly AppClientRouteContribution[] {
  return [
    defineAppRoutes([
      {
        ...agentSessionsRoute(options),
        navigation: {
          title: 'navigation.agentSessions',
          icon: MessagesSquare,
          order: 0.5,
        },
        breadcrumb: { title: 'navigation.agentSessions' },
      },
    ]),
  ];
}
