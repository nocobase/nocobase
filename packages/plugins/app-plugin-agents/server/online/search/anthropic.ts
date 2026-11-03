import {
  createAnthropic,
  type AnthropicLanguageModelOptions,
} from '@ai-sdk/anthropic';
import { z } from 'zod';
import type { NativeSearchCall, NativeSearchEvidence } from './contracts.js';

export interface AnthropicSearchCall extends NativeSearchCall {
  readonly providerOptions: {
    anthropic: Pick<
      AnthropicLanguageModelOptions,
      'thinking' | 'disableParallelToolUse'
    >;
  };
}

/** Basic hosted search only: no dynamic-filtering code execution or client-side tools. */
export function anthropicSearchCall(
  settings: Parameters<typeof createAnthropic>[0],
  model: string,
): AnthropicSearchCall {
  const provider = createAnthropic(settings);
  return {
    model: provider(model),
    tools: { web_search: provider.tools.webSearch_20250305({ maxUses: 1 }) },
    toolChoice: { type: 'tool', toolName: 'web_search' },
    include: { responseBody: true },
    providerOptions: {
      anthropic: {
        thinking: { type: 'disabled' },
        disableParallelToolUse: true,
      },
    },
    evidence: anthropicSearchEvidence,
  };
}

const ResultSchema = z.object({
  type: z.string(),
  url: z.string(),
  title: z.string().nullish(),
});
const EvidenceSchema = z.object({
  content: z.array(
    z.object({
      type: z.string(),
      id: z.string().optional(),
      name: z.string().optional(),
      tool_use_id: z.string().optional(),
      content: z
        .union([z.array(ResultSchema), z.object({ type: z.string() })])
        .optional(),
    }),
  ),
});

/** A result array must belong to an actual hosted web_search invocation, not text citations alone. */
export function anthropicSearchEvidence(body: unknown): NativeSearchEvidence {
  const parsed = EvidenceSchema.safeParse(body);
  if (!parsed.success) return { executed: false, sources: [] };
  const calls = new Set(
    parsed.data.content
      .filter(
        (part) => part.type === 'server_tool_use' && part.name === 'web_search',
      )
      .map((part) => part.id),
  );
  const completed = parsed.data.content.filter(
    (part) =>
      part.type === 'web_search_tool_result' &&
      part.tool_use_id &&
      calls.has(part.tool_use_id) &&
      Array.isArray(part.content),
  );
  return {
    executed: completed.length > 0,
    sources: completed.flatMap((part) =>
      Array.isArray(part.content)
        ? part.content.flatMap((item) =>
            item.type === 'web_search_result'
              ? [
                  {
                    url: item.url,
                    ...(item.title ? { title: item.title } : {}),
                  },
                ]
              : [],
          )
        : [],
    ),
  };
}
