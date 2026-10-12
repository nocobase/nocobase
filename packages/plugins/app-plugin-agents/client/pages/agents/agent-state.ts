import type { AgentView } from '../../../shared/agents.js';

/** The filters of the Agent page's table, by what an agent's state is. */
export const AGENT_FILTERS = [
  'all',
  'enabled',
  'pending',
  'unreported',
] as const;

export type AgentFilter = (typeof AGENT_FILTERS)[number];

/** What a row's state reads as: enabled, pending, disabled, or no runner (none reported it lately). */
export type AgentState = 'enabled' | 'pending' | 'disabled' | 'unreported';

export function stateOf(agent: AgentView): AgentState {
  if (!agent.reported) return 'unreported';
  return agent.status;
}

export function matches(agent: AgentView, filter: AgentFilter): boolean {
  if (filter === 'all') return true;
  return stateOf(agent) === filter;
}

/** Pending first, then enabled, then the rest; within each, by name. */
export function ordered(agents: readonly AgentView[]): AgentView[] {
  const rank: Readonly<Record<AgentState, number>> = {
    pending: 0,
    enabled: 1,
    disabled: 2,
    unreported: 3,
  };
  return [...agents].sort(
    (a, b) =>
      rank[stateOf(a)] - rank[stateOf(b)] || a.name.localeCompare(b.name),
  );
}
