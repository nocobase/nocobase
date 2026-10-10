import { TOOL_MODEL_SUGGESTIONS } from '@nocobase/agent-protocol';
import { describe, expect, it } from 'vitest';

import {
  modelSuggestions,
  type ModelSuggestionRunner,
} from '../../client/lib/model-suggestions.js';

function runtime(
  id: string,
  overrides: Partial<ModelSuggestionRunner> = {},
): ModelSuggestionRunner {
  return {
    id,
    name: id,
    status: 'online',
    enabledTools: null,
    tools: [{ kind: 'pi', authenticated: true }],
    ...overrides,
  };
}

describe('reported model suggestions', () => {
  it('keeps built-in suggestions while runners load or have no capability fields', () => {
    for (const runners of [undefined, [runtime('older')]]) {
      expect(modelSuggestions('pi', runners)).toEqual(
        TOOL_MODEL_SUGGESTIONS.pi.map((id) => ({
          id,
          builtIn: true,
          runners: [],
        })),
      );
    }
  });

  it('deduplicates models and reporters while preserving distinct providers and built-in sources', () => {
    const common = TOOL_MODEL_SUGGESTIONS.pi[0]!;
    const tools: ModelSuggestionRunner['tools'] = [
      {
        kind: 'pi',
        authenticated: true,
        modelsDetectionStatus: 'detected',
        models: [
          { id: common },
          { id: 'openai/gpt-6-sol', efforts: ['low', 'high'] },
          { id: 'openai/gpt-6-sol', efforts: ['high'] },
          { id: 'other/gpt-6-sol' },
        ],
      },
      { kind: 'codex', authenticated: true, models: [{ id: 'codex-only' }] },
    ];
    const runners = [
      runtime('office', { tools }),
      runtime('laptop', {
        tools: [
          {
            kind: 'pi',
            authenticated: true,
            models: [{ id: 'openai/gpt-6-sol', efforts: ['medium', 'high'] }],
          },
        ],
      }),
    ];
    const before = JSON.stringify(runners);
    const suggestions = modelSuggestions('pi', runners);
    expect(suggestions.filter((item) => item.id === common)).toEqual([
      {
        id: common,
        builtIn: true,
        runners: [{ id: 'office', name: 'office', available: true }],
      },
    ]);
    expect(
      suggestions.find((item) => item.id === 'openai/gpt-6-sol'),
    ).toMatchObject({
      builtIn: false,
      runners: [
        { id: 'office', name: 'office', available: true },
        { id: 'laptop', name: 'laptop', available: true },
      ],
      efforts: ['low', 'high', 'medium'],
    });
    expect(suggestions.some((item) => item.id === 'other/gpt-6-sol')).toBe(
      true,
    );
    expect(suggestions.some((item) => item.id === 'codex-only')).toBe(false);
    expect(JSON.stringify(runners)).toBe(before);
  });

  it('distinguishes retained reports from currently ready runners and ignores failed detections', () => {
    const tools: ModelSuggestionRunner['tools'] = [
      { kind: 'pi', authenticated: true, models: [{ id: 'openai/gpt-6-sol' }] },
    ];
    const suggestions = modelSuggestions('pi', [
      runtime('offline', { status: 'offline', tools }),
      runtime('revoked', { status: 'revoked', tools }),
      runtime('disabled', { enabledTools: ['claude'], tools }),
      runtime('signed-out', {
        tools: [{ ...tools[0]!, authenticated: false }],
      }),
      runtime('failed', {
        tools: [{ ...tools[0]!, modelsDetectionStatus: 'failed' }],
      }),
      runtime('future-status', {
        tools: [{ ...tools[0]!, modelsDetectionStatus: 'future-status' }],
      }),
    ]);
    expect(
      suggestions.find((item) => item.id === 'openai/gpt-6-sol')?.runners,
    ).toEqual(
      ['offline', 'revoked', 'disabled', 'signed-out'].map((id) => ({
        id,
        name: id,
        available: false,
      })),
    );
  });

  it('distinguishes unknown reasoning support from an explicitly empty report', () => {
    const suggestions = modelSuggestions('pi', [
      runtime('office', {
        tools: [
          {
            kind: 'pi',
            authenticated: true,
            models: [{ id: 'unknown' }, { id: 'none', efforts: [] }],
          },
        ],
      }),
    ]);
    expect(
      suggestions.find((item) => item.id === 'unknown')?.efforts,
    ).toBeUndefined();
    expect(suggestions.find((item) => item.id === 'none')?.efforts).toEqual([]);
  });
});
