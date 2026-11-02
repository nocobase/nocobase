import {
  createAlibaba,
  type AlibabaLanguageModelChatOptions,
} from '@ai-sdk/alibaba';
import { z } from 'zod';
import type { NativeSearchCall } from './contracts.js';

export interface AlibabaSearchCall extends NativeSearchCall {
  readonly providerOptions: { alibaba: AlibabaLanguageModelChatOptions };
}

/** Chat Completions exposes a search switch but no independently verifiable search evidence. */
export function alibabaSearchCall(
  settings: NonNullable<Parameters<typeof createAlibaba>[0]>,
  model: string,
): AlibabaSearchCall {
  const fetch = settings.fetch ?? globalThis.fetch;
  const provider = createAlibaba({
    ...settings,
    fetch: (input, init) => {
      if (typeof init?.body !== 'string')
        throw new Error('Invalid Alibaba search request.');
      const value: unknown = JSON.parse(init.body);
      const body = z.record(z.string(), z.unknown()).parse(value);
      return fetch(input, {
        ...init,
        body: JSON.stringify({
          ...body,
          enable_search: true,
          search_options: { forced_search: true },
        }),
      });
    },
  });
  return {
    model: provider(model),
    tools: {},
    toolChoice: 'auto',
    include: { responseBody: true },
    providerOptions: {
      alibaba: { enableThinking: false, preserveThinking: false },
    },
    evidence: () => ({ executed: false, sources: [] }),
  };
}
