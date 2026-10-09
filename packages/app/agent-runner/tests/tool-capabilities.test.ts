import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_TOOL_MODELS,
  MAX_MODEL_EFFORTS,
  type AgentTool,
} from '@nocobase/agent-protocol';
import { createEchoAdapter } from '../src/agent/adapters/echo.ts';
import { boundedModels } from '../src/agent/adapters/models.ts';
import {
  ToolCapabilitiesCache,
  MODEL_REFRESH_INTERVAL_MS,
} from '../src/core/tool-capabilities.ts';

afterEach(() => vi.useRealTimers());

describe('capability refresh', () => {
  it('refreshes after the interval, without waiting or duplicating in-flight detection', async () => {
    vi.useFakeTimers();
    const adapter = createEchoAdapter({ kind: 'pi' });
    let resolve!: (value: {
      modelsDetectionStatus: 'detected';
      models: { id: string }[];
    }) => void;
    const detectModels = vi.fn(
      () =>
        new Promise<{
          modelsDetectionStatus: 'detected';
          models: { id: string }[];
        }>((done) => {
          resolve = done;
        }),
    );
    const cache = new ToolCapabilitiesCache(
      new Map([['pi', { ...adapter, detectModels }]]),
      [{ kind: 'pi', authenticated: true }],
    );
    expect(cache.refresh()).toBeUndefined();
    cache.refresh();
    expect(detectModels).toHaveBeenCalledTimes(1);
    expect(cache.tools[0]?.models).toBeUndefined();
    resolve({
      modelsDetectionStatus: 'detected',
      models: [{ id: 'gpt-6-sol' }],
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(cache.tools[0]).toMatchObject({
      models: [{ id: 'gpt-6-sol' }],
      modelsDetectedAt: expect.any(String),
    });
    cache.refresh();
    expect(detectModels).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(MODEL_REFRESH_INTERVAL_MS);
    cache.refresh();
    expect(detectModels).toHaveBeenCalledTimes(2);
    resolve({ modelsDetectionStatus: 'detected', models: [] });
    await vi.advanceTimersByTimeAsync(0);
    expect(cache.tools[0]?.models).toEqual([]);
    cache.stop();
  });

  it('isolates failure and timeout, clears stale models, reports unsupported and recovers', async () => {
    vi.useFakeTimers();
    const adapters = new Map<AgentTool, ReturnType<typeof createEchoAdapter>>([
      [
        'pi',
        {
          ...createEchoAdapter({ kind: 'pi' }),
          detectModels: vi
            .fn()
            .mockRejectedValueOnce(new Error('/private/config token=secret'))
            .mockResolvedValue({
              modelsDetectionStatus: 'detected',
              models: [{ id: 'gpt-6-sol' }],
            }),
        },
      ],
      [
        'codex',
        {
          ...createEchoAdapter({ kind: 'codex' }),
          detectModels: () => new Promise(() => {}),
        },
      ],
      ['claude', createEchoAdapter({ kind: 'claude' })],
    ]);
    const cache = new ToolCapabilitiesCache(
      adapters,
      [
        { kind: 'pi', authenticated: true, models: [{ id: 'stale' }] },
        { kind: 'codex', authenticated: true },
        { kind: 'claude', authenticated: true },
      ],
      Date.now,
      50,
    );
    cache.refresh();
    await vi.advanceTimersByTimeAsync(51);
    expect(cache.tools).toMatchObject([
      {
        modelsDetectionStatus: 'failed',
        modelsDetectionError: 'Model detection failed',
      },
      {
        modelsDetectionStatus: 'failed',
        modelsDetectionError: 'Model detection timed out',
      },
      { modelsDetectionStatus: 'unsupported' },
    ]);
    expect(cache.tools[0]?.models).toBeUndefined();
    expect(JSON.stringify(cache.tools)).not.toContain('secret');
    await vi.advanceTimersByTimeAsync(MODEL_REFRESH_INTERVAL_MS);
    cache.refresh();
    await vi.advanceTimersByTimeAsync(51);
    expect(cache.tools[0]?.models).toEqual([{ id: 'gpt-6-sol' }]);
    cache.stop();
  });

  it('aborts discovery on stop and ignores late results', async () => {
    const adapter = createEchoAdapter({ kind: 'pi' });
    let signal!: AbortSignal;
    const cache = new ToolCapabilitiesCache(
      new Map([
        [
          'pi',
          {
            ...adapter,
            detectModels: (input: AbortSignal) => {
              signal = input;
              return new Promise(() => {});
            },
          },
        ],
      ]),
      [{ kind: 'pi', authenticated: true }],
    );
    cache.refresh();
    cache.stop();
    expect(signal.aborted).toBe(true);
    await Promise.resolve();
    expect(cache.tools[0]?.modelsDetectionStatus).toBeUndefined();
  });
});

it('bounds and deduplicates identifiers and efforts without forwarding arbitrary data', () => {
  const models = boundedModels([
    { id: 'gpt-6-sol', efforts: ['high', 'high'] },
    { id: 'gpt-6-sol', efforts: ['low'] },
    { id: 'sk-1' + 'x'.repeat(48) },
    { id: 'https://private.example/model' },
    { id: 'x'.repeat(201) },
    {
      id: 'efforts',
      efforts: Array.from({ length: 100 }, (_, n) => `effort${n}`),
    },
    ...Array.from({ length: 1000 }, (_, n) => ({ id: `model${n}` })),
  ]);
  expect(models).toHaveLength(MAX_TOOL_MODELS);
  expect(models[0]).toEqual({ id: 'gpt-6-sol', efforts: ['high', 'low'] });
  expect(models[1]?.efforts).toHaveLength(MAX_MODEL_EFFORTS);
  expect(JSON.stringify(models)).not.toContain('private');
});
