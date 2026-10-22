/**
 * The available models list (`GET /api/agents/availableModels`): every tool and model any runner has reported,
 * whichever an agent exists for or not, for the enable dialog to group by tool and create from. Replaces the old
 * "New discoveries" section, which read pending agents a runner's report created one of per model — the thing that
 * once produced hundreds of pending agents for a single ACP tool. This file only reads; nothing here writes.
 *
 * Grouped in two steps so the dialog never fetches every tool's models at once: `availableModelGroups` lists each
 * tool once, with its model count and aggregated availability; `availableModelRows` lists one tool's models, for the
 * route to page.
 */
import type { AgentTool, ToolStatusReason } from '@nocobase/agent-protocol';

import type {
  Agent,
  AvailableModel,
  AvailableModelGroup,
  ModelAvailabilityStatus,
} from '../../../shared/agents.js';
import {
  reportedCombos,
  runnerAgentId,
  type AgentService,
} from './agent.service.js';
import {
  reportedModels,
  toolEnabled,
  type Runner,
} from '../../../shared/runners.js';

/** Most actionable first: a person can fix a sign-in; a vague timeout or mismatch they can only retry. */
const REASON_PRIORITY: readonly ToolStatusReason[] = [
  'notLoggedIn',
  'notConfigured',
  'versionTooOld',
  'otherProgram',
  'timeout',
  'startFailed',
];

function bucketOf(
  reason: ToolStatusReason | undefined,
): ModelAvailabilityStatus {
  switch (reason) {
    case 'notLoggedIn':
      return 'needsLogin';
    case 'notConfigured':
      return 'notConfigured';
    case 'versionTooOld':
      return 'versionTooOld';
    default:
      return 'failed';
  }
}

interface ToolAvailability {
  readonly status: ModelAvailabilityStatus;
  readonly statusReason?: ToolStatusReason;
  readonly statusDetail?: string;
  readonly runnerCount: number;
}

/**
 * `tool`'s availability across every runner that has it selected (`toolEnabled`): `available` when at least one is
 * signed in and ready; otherwise the most actionable reason none is (`REASON_PRIORITY`), with that runner's own words
 * when it gave any. A row inherits its tool's bucket: nothing is offered to create from an unavailable group.
 */
function toolAvailability(
  runners: readonly Runner[],
  tool: AgentTool,
): ToolAvailability {
  const infos = runners
    .filter((runner) => toolEnabled(runner, tool))
    .flatMap((runner) => runner.tools.filter((item) => item.kind === tool));
  const ready = infos.filter(
    (info) => info.authenticated && (!info.status || info.status === 'ready'),
  );
  if (ready.length > 0)
    return { status: 'available', runnerCount: infos.length };
  const withReason = infos.filter(
    (info): info is typeof info & { statusReason: ToolStatusReason } =>
      info.statusReason !== undefined,
  );
  withReason.sort(
    (a, b) =>
      REASON_PRIORITY.indexOf(a.statusReason) -
      REASON_PRIORITY.indexOf(b.statusReason),
  );
  const picked = withReason[0];
  return {
    status: bucketOf(picked?.statusReason),
    ...(picked?.statusReason ? { statusReason: picked.statusReason } : {}),
    ...(picked?.statusDetail ? { statusDetail: picked.statusDetail } : {}),
    runnerCount: infos.length,
  };
}

interface Combo {
  readonly tool: AgentTool;
  readonly model: string;
  readonly displayModel?: string;
}

/** Every tool and model `runners` report, plus any agent's that no runner currently reports (it may be offline). */
function allCombos(
  runners: readonly Runner[],
  agents: readonly Agent[],
): Map<string, Combo> {
  const combos = new Map<string, Combo>();
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
  return combos;
}

/** Matches the tool name, the model's own id, or its display name: whichever a person searched by. */
function matchesQuery(tool: AgentTool, combo: Combo, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return (
    tool.toLowerCase().includes(needle) ||
    combo.model.toLowerCase().includes(needle) ||
    (combo.displayModel?.toLowerCase().includes(needle) ?? false)
  );
}

export interface AvailableModelOptions {
  readonly recommendedModels: readonly {
    readonly tool: AgentTool;
    readonly model: string;
  }[];
  readonly suggestion: AgentService['suggestion'];
}

export interface AvailableModelFilter {
  readonly q?: string;
  readonly status?: ModelAvailabilityStatus;
}

/**
 * One row per coding tool any runner has selected, for the enable drawer's group headers: how many models matched
 * `filter`, how many runners have the tool selected, and its aggregated availability. Bounded by the number of
 * catalog tools, never by how many models one of them lists — the thing the flat list used to ship all at once.
 */
export function availableModelGroups(
  runners: readonly Runner[],
  agents: readonly Agent[],
  options: AvailableModelOptions,
  filter: AvailableModelFilter = {},
): AvailableModelGroup[] {
  const combos = [...allCombos(runners, agents).values()];
  const recommended = new Set(
    options.recommendedModels.map((item) => `${item.tool}\u0000${item.model}`),
  );
  const byTool = new Map<AgentTool, Combo[]>();
  for (const combo of combos) {
    const list = byTool.get(combo.tool);
    if (list) list.push(combo);
    else byTool.set(combo.tool, [combo]);
  }
  const tools = new Set<AgentTool>([
    ...byTool.keys(),
    ...runners.flatMap((runner) => runner.tools.map((item) => item.kind)),
  ]);
  const groups: AvailableModelGroup[] = [];
  for (const tool of tools) {
    const availability = toolAvailability(runners, tool);
    if (availability.runnerCount === 0) continue;
    if (filter.status && availability.status !== filter.status) continue;
    const toolCombos = (byTool.get(tool) ?? []).filter((combo) =>
      matchesQuery(tool, combo, filter.q ?? ''),
    );
    if (
      filter.q &&
      toolCombos.length === 0 &&
      !tool.toLowerCase().includes(filter.q.trim().toLowerCase())
    )
      continue;
    groups.push({
      tool,
      modelCount: toolCombos.length,
      runnerCount: availability.runnerCount,
      status: availability.status,
      ...(availability.statusReason
        ? { statusReason: availability.statusReason }
        : {}),
      ...(availability.statusDetail
        ? { statusDetail: availability.statusDetail }
        : {}),
      recommendedCount: toolCombos.filter((combo) =>
        recommended.has(`${combo.tool}\u0000${combo.model}`),
      ).length,
    });
  }
  return groups.sort((a, b) => a.tool.localeCompare(b.tool));
}

/** The runners currently offering `tool`, and, of those, the ones reporting `model` by name. */
function rowRunners(
  runners: readonly Runner[],
  tool: AgentTool,
  model: string,
): AvailableModel['runners'] {
  const withTool = runners.filter((runner) => toolEnabled(runner, tool));
  const withModel = withTool.filter((runner) =>
    reportedModels(runner, tool).includes(model),
  );
  return {
    ready: withModel.length,
    total: withTool.length,
    names: withModel.slice(0, 5).map((runner) => runner.name),
  };
}

/**
 * One tool's models, for the enable drawer once its group is open or matched a search: unavailable models are listed
 * too (so an administrator can see what a down tool used to offer) but marked unselectable, their `availability`
 * inherited from the tool's own (`availableModelGroups`).
 */
export function availableModelRows(
  runners: readonly Runner[],
  agents: readonly Agent[],
  options: AvailableModelOptions,
  tool: AgentTool,
  filter: AvailableModelFilter = {},
): AvailableModel[] {
  const byId = new Map(agents.map((agent) => [agent.id, agent] as const));
  const recommended = new Set(
    options.recommendedModels.map((item) => `${item.tool}\u0000${item.model}`),
  );
  const availability = toolAvailability(runners, tool);
  if (filter.status && availability.status !== filter.status) return [];
  const combos = [...allCombos(runners, agents).values()].filter(
    (combo) => combo.tool === tool && matchesQuery(tool, combo, filter.q ?? ''),
  );
  return combos
    .map((combo): AvailableModel => {
      const id = runnerAgentId(combo.tool, combo.model);
      const agent = byId.get(id);
      return {
        tool: combo.tool,
        model: combo.model,
        ...(combo.displayModel ? { displayModel: combo.displayModel } : {}),
        agentId: agent?.id ?? null,
        status: agent?.status ?? null,
        recommended: recommended.has(`${combo.tool}\u0000${combo.model}`),
        suggestion: options.suggestion(combo.tool, combo.model),
        availability: availability.status,
        runners: rowRunners(runners, combo.tool, combo.model),
      };
    })
    .sort((a, b) =>
      (a.displayModel ?? a.model).localeCompare(b.displayModel ?? b.model),
    );
}
