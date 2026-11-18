import {
  createOpenAI,
  type OpenAILanguageModelResponsesOptions,
} from '@ai-sdk/openai';
import type { NativeSearchCall } from './contracts.js';
import { z } from 'zod';
export { supportsOpenAISearch } from './capabilities.js';

export interface OpenAISearchCall extends NativeSearchCall {
  readonly providerOptions: { openai: OpenAILanguageModelResponsesOptions };
}

/** Receives the same connection settings as ordinary model calls; never constructs a second transport policy. */
export function openAISearchCall(
  settings: Parameters<typeof createOpenAI>[0],
  model: string,
): OpenAISearchCall {
  const provider = createOpenAI(settings);
  return {
    model: provider.responses(model),
    tools: {
      web_search: provider.tools.webSearch({ externalWebAccess: true }),
    },
    toolChoice: { type: 'tool', toolName: 'web_search' },
    include: { responseBody: true },
    evidence: openAISearchEvidence,
    providerOptions: {
      openai: {
        reasoningEffort: 'none',
        includeWebSearchSources: true,
        maxToolCalls: 1,
      },
    },
  };
}

/** SDK tool results omit the Responses search status. Require completed native search evidence as well. */
const EvidenceSchema = z.object({
  output: z.array(
    z.object({
      type: z.string(),
      status: z.string().optional(),
      action: z
        .object({
          type: z.string(),
          sources: z
            .array(z.object({ type: z.string(), url: z.string().optional() }))
            .optional(),
        })
        .optional(),
    }),
  ),
});

export interface OpenAISearchEvidence {
  readonly executed: boolean;
  readonly sources: { url: string }[];
}

export function openAISearchEvidence(body: unknown): OpenAISearchEvidence {
  const parsed = EvidenceSchema.safeParse(body);
  if (!parsed.success) return { executed: false, sources: [] };
  const completed = parsed.data.output.filter(
    (item) =>
      item.type === 'web_search_call' &&
      item.status === 'completed' &&
      item.action?.type === 'search',
  );
  return {
    executed: completed.length > 0,
    sources: completed.flatMap((item) =>
      (item.action?.sources ?? []).flatMap((source) =>
        source.type === 'url' && source.url ? [{ url: source.url }] : [],
      ),
    ),
  };
}
