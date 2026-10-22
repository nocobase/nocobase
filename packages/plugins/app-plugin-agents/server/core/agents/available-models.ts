/**
 * The available models list (`GET /api/agents/availableModels`): every tool and model any runner has reported,
 * whichever an agent exists for or not, for the enable dialog to group by tool and create from. Replaces the old
 * "New discoveries" section, which read pending agents a runner's report created one of per model — the thing that
 * once produced hundreds of pending agents for a single ACP tool. This file only reads; nothing here writes.
 *
 * Grouped in two steps so the dialog never fetches every tool's models at once: `availableModelGroups` lists each
 * tool once, with its model count and aggregated availability; `availableModelRows` lists one tool's models, for the
 * route to page. Availability is computed per model, from the online runners currently reporting exactly that model
 * — never an offline runner's old report, and never another model of the same tool standing in for one with no
 * runner of its own.
 */
import type {
  AgentTool,
  ToolInfo,
  ToolStatusReason,
} from '@nocobase/agent-protocol';

import type {
  Agent,
  AvailableModel,
  AvailableModelGroup,
  ModelAvailabilityStatus,
} from '../../../shared/agents.js';
import { TOOL_LABELS } from '../../../shared/model-catalog.js';
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

/** Most actionable first, when more than one online runner disagrees on why a tool is not usable. */
const REASON_PRIORITY: readonly ToolStatusReason[] = [
  'notLoggedIn',
  'signInUnconfirmed',
  'notConfigured',
  'versionTooOld',
  'otherProgram',
  'timeout',
  'startFailed',
];

/**
 * `needsSetup` covers both "not signed in" and "signed in but missing a model or provider": the drawer's fix is the
 * same either way (run the tool's own sign-in/setup command on the runtime). `versionTooOld` stays its own bucket so
 * the filter can single it out; everything else neither a person can act on from here nor confirm is `failed`.
 */
function bucketOf(
  reason: ToolStatusReason | undefined,
): ModelAvailabilityStatus {
  switch (reason) {
    case 'notLoggedIn':
    case 'notConfigured':
      return 'needsSetup';
    case 'versionTooOld':
      return 'versionTooOld';
    default:
      return 'failed';
  }
}

/**
 * The same bucket a runner predating `statusReason` (protocol 13) still earns from `status` alone: its plain
 * `needsLogin` must keep reading as `needsSetup`, not disappear into `failed` for lacking a reason field.
 */
function bucketOfInfo(info: ToolInfo): {
  readonly status: ModelAvailabilityStatus;
  readonly reason?: ToolStatusReason;
  readonly detail?: string;
} {
  if (info.statusReason)
    return {
      status: bucketOf(info.statusReason),
      reason: info.statusReason,
      ...(info.statusDetail ? { detail: info.statusDetail } : {}),
    };
  if (info.status === 'needsLogin') return { status: 'needsSetup' };
  return {
    status: 'failed',
    ...(info.statusDetail ? { detail: info.statusDetail } : {}),
  };
}

interface ToolAvailability {
  readonly status: ModelAvailabilityStatus;
  readonly statusReason?: ToolStatusReason;
  readonly statusDetail?: string;
  /** Online runners that have the tool selected, ready or not. */
  readonly runnerCount: number;
}

/**
 * `tool`'s availability across every *online* runner that has it selected (`toolEnabled`): `available` when at least
 * one is signed in and ready; otherwise the most actionable reason none is (`REASON_PRIORITY`, falling back to the
 * plain `status` for a runner with no reason field), with that runner's own words when it gave any. An offline
 * runner's old report never counts, in either direction: it does not grant readiness and it does not block it.
 */
function toolAvailability(
  runners: readonly Runner[],
  tool: AgentTool,
): ToolAvailability {
  const infos = runners
    .filter((runner) => runner.status === 'online' && toolEnabled(runner, tool))
    .flatMap((runner) => runner.tools.filter((item) => item.kind === tool));
  const ready = infos.filter(
    (info) => info.authenticated && (!info.status || info.status === 'ready'),
  );
  if (ready.length > 0)
    return { status: 'available', runnerCount: infos.length };
  if (infos.length === 0) return { status: 'failed', runnerCount: 0 };
  const classified = infos
    .map((info) => ({ info, ...bucketOfInfo(info) }))
    .sort((a, b) => {
      const ai = a.reason
        ? REASON_PRIORITY.indexOf(a.reason)
        : REASON_PRIORITY.length;
      const bi = b.reason
        ? REASON_PRIORITY.indexOf(b.reason)
        : REASON_PRIORITY.length;
      return ai - bi;
    });
  const picked = classified[0];
  return {
    status: picked.status,
    ...(picked.reason ? { statusReason: picked.reason } : {}),
    ...(picked.detail ? { statusDetail: picked.detail } : {}),
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

/** Matches the tool's display name, the tool's own id, the model's own id, or its display name. */
function matchesQuery(tool: AgentTool, combo: Combo, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return (
    tool.toLowerCase().includes(needle) ||
    TOOL_LABELS[tool].toLowerCase().includes(needle) ||
    combo.model.toLowerCase().includes(needle) ||
    (combo.displayModel?.toLowerCase().includes(needle) ?? false)
  );
}

function toolMatchesQuery(tool: AgentTool, q: string): boolean {
  const needle = q.trim().toLowerCase();
  return (
    !needle ||
    tool.toLowerCase().includes(needle) ||
    TOOL_LABELS[tool].toLowerCase().includes(needle)
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
 * `combo`'s own availability: `available` only when an online runner currently reports exactly this model. When none
 * does, it inherits the tool's own aggregate bucket exactly when that explains why — the tool has no ready runner at
 * all, so no model of it could be ready either — but never borrows a sibling model's `available` the way the tool
 * aggregate alone would suggest: a model with no runner behind it is `failed` (not currently backed), not `available`
 * because something else of the same tool is.
 */
function comboAvailability(
  runners: readonly Runner[],
  tool: AgentTool,
  model: string,
  toolAvail: ToolAvailability,
): {
  readonly status: ModelAvailabilityStatus;
  readonly runners: AvailableModel['runners'];
} {
  const withTool = runners.filter(
    (runner) => runner.status === 'online' && toolEnabled(runner, tool),
  );
  const withModel = withTool.filter((runner) =>
    reportedModels(runner, tool).includes(model),
  );
  const status: ModelAvailabilityStatus =
    withModel.length > 0
      ? 'available'
      : toolAvail.status === 'available'
        ? 'failed'
        : toolAvail.status;
  return {
    status,
    runners: {
      ready: withModel.length,
      total: withTool.length,
      names: withModel.slice(0, 5).map((runner) => runner.name),
    },
  };
}

/**
 * One row per coding tool any runner has selected, for the enable drawer's group headers: how many models matched
 * `filter`, how many online runners have the tool selected, and its aggregated availability. Bounded by the number
 * of catalog tools, never by how many models one of them lists — the thing the flat list used to ship all at once.
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
    const toolAvail = toolAvailability(runners, tool);
    if (toolAvail.runnerCount === 0) continue;
    const toolCombos = (byTool.get(tool) ?? []).filter(
      (combo) =>
        matchesQuery(tool, combo, filter.q ?? '') &&
        (!filter.status ||
          comboAvailability(runners, combo.tool, combo.model, toolAvail)
            .status === filter.status),
    );
    if (
      filter.status &&
      toolAvail.status !== filter.status &&
      toolCombos.length === 0
    )
      continue;
    if (
      filter.q &&
      toolCombos.length === 0 &&
      !toolMatchesQuery(tool, filter.q)
    )
      continue;
    groups.push({
      tool,
      modelCount: toolCombos.length,
      runnerCount: toolAvail.runnerCount,
      status: toolAvail.status,
      ...(toolAvail.statusReason
        ? { statusReason: toolAvail.statusReason }
        : {}),
      ...(toolAvail.statusDetail
        ? { statusDetail: toolAvail.statusDetail }
        : {}),
      recommendedCount: toolCombos.filter((combo) =>
        recommended.has(`${combo.tool}\u0000${combo.model}`),
      ).length,
    });
  }
  return groups.sort((a, b) => a.tool.localeCompare(b.tool));
}

/**
 * One tool's models, for the enable drawer once its group is open or matched a search: unavailable models are listed
 * too (so an administrator can see what a down tool used to offer) but marked unselectable, each with its own
 * availability — a model no online runner currently reports is never shown as available just because a sibling
 * model of the same tool is.
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
  const toolAvail = toolAvailability(runners, tool);
  const combos = [...allCombos(runners, agents).values()].filter(
    (combo) => combo.tool === tool && matchesQuery(tool, combo, filter.q ?? ''),
  );
  return combos
    .map((combo): AvailableModel => {
      const id = runnerAgentId(combo.tool, combo.model);
      const agent = byId.get(id);
      const availability = comboAvailability(
        runners,
        combo.tool,
        combo.model,
        toolAvail,
      );
      return {
        tool: combo.tool,
        model: combo.model,
        ...(combo.displayModel ? { displayModel: combo.displayModel } : {}),
        agentId: agent?.id ?? null,
        status: agent?.status ?? null,
        recommended: recommended.has(`${combo.tool}\u0000${combo.model}`),
        suggestion: options.suggestion(combo.tool, combo.model),
        availability: availability.status,
        runners: availability.runners,
      };
    })
    .filter((row) => !filter.status || row.availability === filter.status)
    .sort((a, b) =>
      (a.displayModel ?? a.model).localeCompare(b.displayModel ?? b.model),
    );
}
