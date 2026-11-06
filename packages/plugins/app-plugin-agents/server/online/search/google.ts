import {
  createGoogleGenerativeAI,
  type GoogleLanguageModelOptions,
} from '@ai-sdk/google';
import { z } from 'zod';
import type { NativeSearchCall, NativeSearchEvidence } from './contracts.js';

export interface GoogleSearchCall extends NativeSearchCall {
  readonly providerOptions: {
    google: Pick<GoogleLanguageModelOptions, 'thinkingConfig'>;
  };
}

/** Google chooses whether to ground; actual executed-query evidence is mandatory afterwards. */
export function googleSearchCall(
  settings: Parameters<typeof createGoogleGenerativeAI>[0],
  model: string,
): GoogleSearchCall {
  const provider = createGoogleGenerativeAI(settings);
  return {
    model: provider(model),
    tools: { google_search: provider.tools.googleSearch({}) },
    toolChoice: 'auto',
    include: { responseBody: true },
    providerOptions: {
      google: { thinkingConfig: { thinkingBudget: 0, includeThoughts: false } },
    },
    evidence: googleSearchEvidence,
  };
}

const EvidenceSchema = z.object({
  candidates: z.array(
    z.object({
      groundingMetadata: z
        .object({
          webSearchQueries: z.array(z.string()).nullish(),
          groundingChunks: z
            .array(
              z.object({
                web: z
                  .object({ uri: z.string(), title: z.string().nullish() })
                  .nullish(),
              }),
            )
            .nullish(),
        })
        .nullish(),
    }),
  ),
});

/** Grounding chunks without executed Google Search queries may come from another retrieval surface. */
export function googleSearchEvidence(body: unknown): NativeSearchEvidence {
  const parsed = EvidenceSchema.safeParse(body);
  const grounding = parsed.success
    ? parsed.data.candidates[0]?.groundingMetadata
    : undefined;
  return {
    executed: !!grounding?.webSearchQueries?.some((query) => query.trim()),
    sources: (grounding?.groundingChunks ?? []).flatMap((chunk) =>
      chunk.web
        ? [
            {
              url: chunk.web.uri,
              ...(chunk.web.title ? { title: chunk.web.title } : {}),
            },
          ]
        : [],
    ),
  };
}
