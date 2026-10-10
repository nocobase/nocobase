/** The editor's projection of optional runner capabilities; older API answers need none of them. */
import {
  TOOL_MODEL_SUGGESTIONS,
  type AgentTool,
  type ToolInfo,
} from '@nocobase/agent-protocol';
import type { RunnerSummary } from '../../shared/runners.js';

export interface ModelCapability {
  readonly id: string;
  readonly efforts?: readonly string[];
}

export interface ModelSuggestionRunner extends Pick<
  RunnerSummary,
  'id' | 'name' | 'status' | 'enabledTools'
> {
  readonly tools: readonly (Pick<ToolInfo, 'kind' | 'authenticated'> & {
    readonly models?: readonly ModelCapability[];
    readonly modelsDetectionStatus?: string;
  })[];
}

export interface ModelReporter {
  readonly id: string;
  /** Use only the name in the viewer's API answer, never machine metadata. */
  readonly name: string;
  readonly available: boolean;
}

export interface ModelSuggestion {
  readonly id: string;
  readonly builtIn: boolean;
  readonly runners: readonly ModelReporter[];
  /** Union of explicitly reported efforts; absent when every reporter left them unknown. */
  readonly efforts?: readonly string[];
}

/** A report never changes a saved entry or establishes permission or account quota. */
export function modelSuggestions(
  tool: AgentTool,
  runners: readonly ModelSuggestionRunner[] | undefined,
): ModelSuggestion[] {
  const suggestions = new Map<string, ModelSuggestion>(
    TOOL_MODEL_SUGGESTIONS[tool].map((id) => [
      id,
      { id, builtIn: true, runners: [] },
    ]),
  );
  for (const runner of runners ?? []) {
    for (const info of runner.tools) {
      if (
        info.kind !== tool ||
        (info.modelsDetectionStatus !== undefined &&
          info.modelsDetectionStatus !== 'detected')
      )
        continue;
      for (const model of info.models ?? []) {
        const previous = suggestions.get(model.id);
        const reporter: ModelReporter = {
          id: runner.id,
          name: runner.name,
          available:
            runner.status === 'online' &&
            info.authenticated &&
            (runner.enabledTools === null ||
              runner.enabledTools.includes(tool)),
        };
        const efforts =
          previous?.efforts === undefined && model.efforts === undefined
            ? undefined
            : [
                ...new Set([
                  ...(previous?.efforts ?? []),
                  ...(model.efforts ?? []),
                ]),
              ];
        suggestions.set(model.id, {
          id: model.id,
          builtIn: previous?.builtIn ?? false,
          runners: [
            ...(previous?.runners.filter((item) => item.id !== runner.id) ??
              []),
            reporter,
          ],
          ...(efforts === undefined ? {} : { efforts }),
        });
      }
    }
  }
  return [...suggestions.values()];
}
