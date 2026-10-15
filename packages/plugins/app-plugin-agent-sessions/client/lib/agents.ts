/** The agents a computer's bridge reported: those installed there, and those it would run once installed. */
import type { AgentInfo } from '../../shared/api.js';

/** The agents installed on the computer, ready or not. */
export function installedAgents(computer: {
  readonly agents: readonly AgentInfo[];
}): AgentInfo[] {
  return computer.agents.filter((agent) => agent.problem !== 'notInstalled');
}

/** The names of the agents the computer would run once installed, as a list in `locale`; empty when none. */
export function otherAgentNames(
  computer: { readonly agents: readonly AgentInfo[] },
  locale: string,
): string {
  const names = computer.agents
    .filter((agent) => agent.problem === 'notInstalled')
    .map((agent) => agent.name);
  return names.length === 0
    ? ''
    : // Narrow: names separated alike, as `Cline、Amp、Mistral Vibe`, without a word before the last.
      new Intl.ListFormat(locale, {
        type: 'conjunction',
        style: 'narrow',
      }).format(names);
}
