// The model list a runner reports for each coding tool. A tool that lists its models reports what it listed
// (`detected`); one that cannot (`unsupported`) reports the built-in list for its kind (`builtin`): the protocol's
// suggestions without Claude Code's bare aliases, which name whatever model is newest rather than one model. The runner's
// owner adds or removes ids per tool (`nocobase-runner config models`), applied on top of either list. A failed
// detection reports no list, so nothing is advertised that could not be confirmed.
import {
  TOOL_MODEL_SUGGESTIONS,
  isNativeTool,
  type AgentTool,
  type ToolInfo,
  type ToolModel,
} from '../protocol/index.ts';
import { boundedModels } from '../agent/adapters/models.ts';

/** Ids that name the newest model of a family rather than one model. */
const ALIASES: ReadonlySet<string> = new Set(['opus', 'sonnet', 'haiku']);

/** What the runner's owner changed in one tool's list. */
export interface ModelListOverride {
  readonly add?: readonly string[];
  readonly remove?: readonly string[];
}

export type ModelListOverrides = Readonly<
  Partial<Record<AgentTool, ModelListOverride>>
>;

/** The built-in list of `tool`, for a tool that cannot list its models. */
export function builtInModels(tool: AgentTool): ToolModel[] {
  return (TOOL_MODEL_SUGGESTIONS[tool] ?? [])
    .filter((id) => !ALIASES.has(id))
    .map((id) => ({ id }));
}

/** `tool` as reported: its detected or built-in list, with the owner's additions and removals. */
export function reportedModels(
  tool: ToolInfo,
  override: ModelListOverride | undefined,
): ToolInfo {
  if (!isNativeTool(tool.kind)) return tool;
  const status = tool.modelsDetectionStatus;
  if (tool.kind === 'pi' && status !== 'detected')
    return { ...tool, models: [] };
  // Not detected yet, failed, or a tool that is not signed in: nothing to report beyond what detection said.
  if (status === undefined || status === 'failed') return tool;
  const builtin = status === 'unsupported';
  if (builtin && !tool.authenticated) return tool;
  const base = builtin ? builtInModels(tool.kind) : (tool.models ?? []);
  const removed = new Set(override?.remove ?? []);
  const models = boundedModels([
    ...base.filter((model) => !removed.has(model.id)),
    ...(override?.add ?? [])
      // Pi's authenticated listing is authoritative; an override must not add an unconfigured provider.
      .filter(
        (id) =>
          tool.kind !== 'pi' ||
          base.some((model) => model.id.split('/')[0] === id.split('/')[0]),
      )
      .filter((id) => !removed.has(id))
      .map((id) => ({ id })),
  ]);
  return {
    ...tool,
    models,
    modelsSource: builtin ? 'builtin' : 'detected',
  };
}
