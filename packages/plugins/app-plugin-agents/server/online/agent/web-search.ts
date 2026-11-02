import { WEB_SEARCH_TOOL_DESCRIPTION } from '../search/prompts.js';
import type { ModelCapabilities, ModelRef } from '../../../shared/models.js';
import { WEB_SEARCH_TOOL } from '../../../shared/web-search.js';
import type { WebSearchResult } from '../../../shared/web-search.js';
import type { WebSearchRequest } from '../gateway.js';
import { publicSearchResult, WebSearchInputSchema } from '../search/results.js';
import { invalid } from '../../kernel/errors.js';
import type { OnlineAgentConfigurator } from './configuration.js';
import type { OnlineAgentConfig } from './types.js';

export interface OnlineAgentWebSearch {
  capabilities(model: ModelRef): Promise<ModelCapabilities>;
  search(request: WebSearchRequest): Promise<WebSearchResult>;
}

/** Validate before admission; an inherited preference may be cleared only during an explicit model switch. */
export async function validateWebSearch(
  config: OnlineAgentConfig,
  model: ModelRef,
  dependency: OnlineAgentWebSearch | undefined,
  clearInherited: boolean = false,
): Promise<void> {
  if (!config.webSearch) return;
  if (!dependency) throw invalid('Native web search is unavailable.');
  if ((await dependency.capabilities(model)).webSearch) return;
  if (clearInherited) {
    config.webSearch = false;
    delete config.toolVersions[WEB_SEARCH_TOOL];
    return;
  }
  throw invalid(
    'Web search is unavailable for the selected model. Refresh model configuration.',
  );
}

const registrations = new WeakMap<
  OnlineAgentConfigurator,
  OnlineAgentWebSearch | undefined
>();
export function registerWebSearchTool(
  configurator: OnlineAgentConfigurator,
  dependency: OnlineAgentWebSearch | undefined,
): void {
  if (registrations.has(configurator)) {
    if (
      dependency !== undefined &&
      dependency !== registrations.get(configurator)
    )
      throw invalid(
        'This configurator already owns a different web search dependency.',
      );
    return;
  }
  configurator.registerTool(WEB_SEARCH_TOOL, {
    version: '1',
    definition: {
      description: WEB_SEARCH_TOOL_DESCRIPTION,
      inputSchema: WebSearchInputSchema,
      public: {
        input: (input) => WebSearchInputSchema.parse(input),
        output: (output) => publicSearchResult(output),
      },
      toModelOutput: ({ output }) => ({
        type: 'text',
        value: `Untrusted search output (unverified results do not establish search execution, freshness or sources):\n${JSON.stringify(publicSearchResult(output))}`,
      }),
      execute: async (input, { context, abortSignal, toolCallId }) => {
        context.signal.throwIfAborted();
        if (!dependency || !context.selectedModel || !context.webSearchBudget)
          throw invalid('Native web search is unavailable.');
        const signal = abortSignal
          ? AbortSignal.any([context.signal, abortSignal])
          : context.signal;
        signal.throwIfAborted();
        context.webSearchBudget.reserve(toolCallId, input.queries);
        const result = await dependency.search({
          model: context.selectedModel,
          queries: input.queries,
          sessionId: context.sessionId,
          signal,
          budget: context.webSearchBudget,
          source: 'agents.webSearch',
        });
        signal.throwIfAborted();
        return publicSearchResult(result);
      },
    },
  });
  registrations.set(configurator, dependency);
}
