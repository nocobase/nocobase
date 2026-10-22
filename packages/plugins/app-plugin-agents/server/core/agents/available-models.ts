/**
 * The available models list (`GET /api/agents/availableModels`): every tool and model any runner has reported,
 * whichever an agent exists for or not, for the enable dialog to group by tool and create from. Replaces the old
 * "New discoveries" section, which read pending agents a runner's report created one of per model — the thing that
 * once produced hundreds of pending agents for a single ACP tool. This file only reads; nothing here writes.
 */
import type { AgentTool } from '@nocobase/agent-protocol';

import type { Agent, AvailableModel } from '../../../shared/agents.js';
import {
  reportedCombos,
  runnerAgentId,
  type AgentService,
} from './agent.service.js';
import type { Runner } from '../../../shared/runners.js';

/** Every tool and model `runners` report, plus any agent's that no runner currently reports (it may be offline). */
export function availableModels(
  runners: readonly Runner[],
  agents: readonly Agent[],
  options: {
    readonly recommendedModels: readonly {
      readonly tool: AgentTool;
      readonly model: string;
    }[];
    readonly suggestion: AgentService['suggestion'];
  },
): AvailableModel[] {
  const byId = new Map(agents.map((agent) => [agent.id, agent] as const));
  const recommended = new Set(
    options.recommendedModels.map((item) => `${item.tool}\u0000${item.model}`),
  );
  const combos = new Map<
    string,
    { tool: AgentTool; model: string; displayModel?: string }
  >();
  for (const runner of runners)
    for (const combo of reportedCombos(runner)) {
      const id = runnerAgentId(combo.tool, combo.model);
      if (combos.has(id)) continue;
      const displayModel = runner.tools
        .find((tool) => tool.kind === combo.tool)
        ?.models?.find((model) => model.id === combo.model)?.name;
      combos.set(id, { ...combo, ...(displayModel ? { displayModel } : {}) });
    }
  // An agent offline runners stopped reporting stays listed: it is not forgotten just because nothing reports it now.
  for (const agent of agents)
    if (agent.source === 'runner' && agent.tool && !combos.has(agent.id))
      combos.set(agent.id, { tool: agent.tool, model: agent.model ?? '' });
  return [...combos.entries()]
    .map(([id, combo]): AvailableModel => {
      const agent = byId.get(id);
      return {
        tool: combo.tool,
        model: combo.model,
        ...(combo.displayModel ? { displayModel: combo.displayModel } : {}),
        agentId: agent?.id ?? null,
        status: agent?.status ?? null,
        recommended: recommended.has(`${combo.tool}\u0000${combo.model}`),
        suggestion: options.suggestion(combo.tool, combo.model),
      };
    })
    .sort(
      (a, b) =>
        a.tool.localeCompare(b.tool) ||
        (a.displayModel ?? a.model).localeCompare(b.displayModel ?? b.model),
    );
}
