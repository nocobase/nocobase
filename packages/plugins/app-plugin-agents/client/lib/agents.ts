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
