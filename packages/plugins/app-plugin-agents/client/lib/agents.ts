import type { AgentTool } from '@nocobase/agent-protocol';

import {
  isRunnerEntry,
  type AgentModelEntry,
  type AgentSummary,
} from '../../shared/agents.js';
import type {
  ChatAgent,
  ChatAvailability,
} from '../../shared/conversations.js';
import { runsTool, type RunnerSummary } from '../../shared/runners.js';

/** Whether the agent can answer now, as the agents list counts it: a runner online for it, or its model offered. */
export function availabilityOf(agent: AgentSummary): ChatAvailability {
  return agent.onlineRunners > 0
    ? { online: true, reason: null, onlineRunners: agent.onlineRunners }
    : {
        online: false,
        reason: agent.type === 'runner' ? 'noRunner' : 'modelUnavailable',
        onlineRunners: 0,
      };
}

/** An agent of the agents list as the agent picker takes it, named `name` (such as in the viewer's language). */
export function pickerAgentOf(
  agent: AgentSummary,
  name: string,
  isSystemDefault: boolean = false,
): ChatAgent {
  return {
    id: agent.id,
    name,
    description: agent.description,
    nameText: null,
    descriptionText: null,
    avatar: agent.avatar,
    type: agent.type,
    models: [],
    personal: false,
    isSystemDefault,
    isMyDefault: false,
    availability: availabilityOf(agent),
    fallbackAgentId: null,
  };
}

/** An entry of an agent's tools and models as one line: `Claude Code · opus`, `openai · gpt-5`. */
export function entryText(
  entry: AgentModelEntry,
  t: (key: string) => string,
): string {
  const effort = entry.effort
    ? ` · ${t(`agentForm.efforts.${entry.effort}`)}`
    : '';
  return isRunnerEntry(entry)
    ? `${t(`tools.${entry.tool}`)} · ${entry.model ?? t('agents.defaultModel')}${effort}`
    : `${entry.modelService} · ${entry.model}${effort}`;
}

/** Whether `runner` is online and has `tool` enabled, installed and signed in: it can take that tool's work now. */
export function offersTool(runner: RunnerSummary, tool: AgentTool): boolean {
  return runner.status === 'online' && runsTool(runner, tool);
}

/** How many runners can take `tool`'s work now, among `runnerIds` when it names any. */
export function onlineFor(
  runners: readonly RunnerSummary[],
  tool: AgentTool,
  runnerIds: readonly string[] = [],
): number {
  return runners.filter(
    (runner) =>
      offersTool(runner, tool) &&
      (runnerIds.length === 0 || runnerIds.includes(runner.id)),
  ).length;
}

/**
 * The agents list's order: agents everyone can use, the application's own first in the order it added them; then the
 * caller's own; then the ones others share with them. Within a group, by the name people see.
 */
export function orderAgents<Agent extends AgentSummary>(
  agents: readonly Agent[],
  nameOf: (agent: Agent) => string,
  locale?: string,
): Agent[] {
  const collator = new Intl.Collator(locale, { sensitivity: 'base' });
  const group = (agent: Agent): number =>
    agent.access === 'everyone'
      ? agent.nameText
        ? 0
        : 1
      : agent.owned
        ? 2
        : 3;
  return agents
    .map((agent) => ({ agent, group: group(agent), name: nameOf(agent) }))
    .sort(
      (a, b) =>
        a.group - b.group ||
        (a.group === 0
          ? a.agent.createdAt.localeCompare(b.agent.createdAt)
          : collator.compare(a.name, b.name)) ||
        a.agent.id.localeCompare(b.agent.id),
    )
    .map(({ agent }) => agent);
}
