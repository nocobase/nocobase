/**
 * Where the agent management pages are mounted, for the links one page makes to another that are not under its own
 * route: the business mount (`/agents`, `/usage`, as the application routes `client/routes.ts`) by default, or the
 * System settings mount (`agentsSettingsRoutes`). A page's links to its own children and parent resolve relative to
 * its route instead, so they follow any mount.
 */
import { createContext, useContext, type Context } from 'react';

export interface AgentsMount {
  /** Where a usage row of one agent links to, or null when that mount has no page for it. */
  readonly agentRouteId?: string;
  readonly agentLink: (key: string) => string | null;
}

/** The application routes the pages itself: an agent's own page is `/agents/<key>`. */
export const BUSINESS_MOUNT: AgentsMount = {
  agentLink: (key) => `/agents/${encodeURIComponent(key)}`,
};

/** The System settings mount has no page per agent, so an agent's row opens the agents list. */
export function settingsMount(agentsPath: string): AgentsMount {
  return {
    agentRouteId: '@nocobase/app-plugin-agents:agents',
    agentLink: () => agentsPath,
  };
}

export const AgentsMountContext: Context<AgentsMount> =
  createContext<AgentsMount>(BUSINESS_MOUNT);

export function useAgentsMount(): AgentsMount {
  return useContext(AgentsMountContext);
}
