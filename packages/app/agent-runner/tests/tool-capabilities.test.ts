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
  detectTools,
} from '../src/core/tool-capabilities.ts';
import type { ToolDetection } from '../src/agent/adapters/types.ts';

afterEach(() => vi.useRealTimers());

describe('capability refresh', () => {
  it('uses a fresh instance each round, discovers missing tools and replaces version, path, authentication and models together', async () => {
    vi.useFakeTimers();
    let current: ToolDetection = { installed: false, authenticated: false };
    const instances: object[] = [];
    const factory = () => {
      let cached: Promise<ToolDetection> | undefined;
      const adapter = {
        ...createEchoAdapter({ kind: 'opencode' }),
        detect: () => (cached ??= Promise.resolve({ ...current })),
        detectModels: async () => ({
          modelsDetectionStatus: 'detected' as const,
          models: [{ id: (await adapter.detect()).version! }],
        }),
      };
      instances.push(adapter);
      return new Map([['opencode' as const, adapter]]);
    };
    const cache = new ToolCapabilitiesCache(factory, []);
    const round = async () => {
      cache.refresh();
      await vi.advanceTimersByTimeAsync(0);
    };
    await round();
    expect(cache.tools).toMatchObject([
      { authenticated: false, status: 'notInstalled' },
    ]);
    for (const next of [
      { installed: false, authenticated: false, version: '1.9.0' },
      {
        installed: true,
        authenticated: false,
        version: '2.0.28',
        path: '/first/opencode',
      },
      {
        installed: true,
        authenticated: true,
        version: '2.0.29',
        path: '/first/opencode',
      },
      {
        installed: true,
        authenticated: false,
        version: '2.0.30',
        path: '/second/opencode',
      },
      { installed: false, authenticated: false },
    ]) {
      current = next;
      await vi.advanceTimersByTimeAsync(MODEL_REFRESH_INTERVAL_MS);
      await round();
      if (next.installed)
        expect(cache.tools).toEqual([
          expect.objectContaining({
            kind: 'opencode',
            version: next.version,
            path: next.path,
            authenticated: next.authenticated,
            ...(next.authenticated ? { models: [{ id: next.version }] } : {}),
          }),
        ]);
      else
        expect(cache.tools).toMatchObject([
          { status: 'notInstalled', authenticated: false },
        ]);
    }
    expect(new Set(instances).size).toBe(6);
    await cache.stop();
  });

  it('removes failed basic detection, cancels timeouts, ignores late results and recovers next round', async () => {
    vi.useFakeTimers();
    let finish!: (result: ToolDetection) => void;
    let signal!: AbortSignal;
    let healthy = false;
    const factory = vi.fn(
      () =>
        new Map([
          [
            'pi' as const,
            {
              ...createEchoAdapter({ kind: 'pi' }),
              detect: (input?: AbortSignal) => {
                signal = input!;
                return healthy
                  ? Promise.resolve({
                      installed: true,
                      version: 'new',
                      authenticated: true,
                    })
                  : new Promise<ToolDetection>((resolve) => {
                      finish = resolve;
                    });
              },
            },
          ],
        ]),
    );
    const cache = new ToolCapabilitiesCache(
      factory,
      [{ kind: 'pi', version: 'old', authenticated: true }],
      Date.now,
      50,
    );
    cache.refresh();
    cache.refresh();
    expect(factory).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(51);
    expect(signal.aborted).toBe(true);
    expect(cache.tools).toMatchObject([
      { status: 'failed', authenticated: false },
    ]);
    finish({ installed: true, version: 'late', authenticated: true });
    await vi.advanceTimersByTimeAsync(0);
    expect(cache.tools).toMatchObject([
      { status: 'failed', authenticated: false },
    ]);
    healthy = true;
    await vi.advanceTimersByTimeAsync(MODEL_REFRESH_INTERVAL_MS);
    cache.refresh();
    await vi.advanceTimersByTimeAsync(0);
    expect(cache.tools[0]?.version).toBe('new');
    await cache.stop();
  });

  it('bounds initial inspection and cancels it on environment replacement', async () => {
    const stop = new AbortController();
    let input!: AbortSignal;
    const tools = detectTools(
      new Map([
        [
          'pi',
          {
            ...createEchoAdapter(),
            detect: (signal) => {
              input = signal!;
              return new Promise(() => {});
            },
          },
        ],
      ]),
      stop.signal,
    );
    stop.abort();
    expect(await tools).toEqual([]);
    expect(input.aborted).toBe(true);
  });

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
      () => new Map([['pi', { ...adapter, detectModels }]]),
      [{ kind: 'pi', authenticated: true }],
    );
    expect(cache.refresh()).toBeUndefined();
    cache.refresh();
    await vi.advanceTimersByTimeAsync(0);
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
    await vi.advanceTimersByTimeAsync(0);
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
      () => adapters,
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
      () =>
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
    await new Promise((resolve) => setTimeout(resolve, 0));
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

it('retains versioned model identifiers', () => {
  expect(boundedModels([{ id: 'claude-sonnet-4@20250514' }])).toEqual([
    { id: 'claude-sonnet-4@20250514' },
  ]);
});

it('does not handshake again until a program changes or a refresh is requested', async () => {
  vi.useFakeTimers();
  let fingerprint = 'path-a:version-a:mtime-a';
  const detect = vi.fn(async () => ({ installed: true, authenticated: true }));
  const cache = new ToolCapabilitiesCache(
    () =>
      new Map([
        [
          'gemini',
          {
            ...createEchoAdapter({ kind: 'gemini' }),
            detect,
            fingerprint: async () => fingerprint,
          },
        ],
      ]),
    [],
  );
  cache.refresh();
  await vi.advanceTimersByTimeAsync(0);
  expect(detect).toHaveBeenCalledTimes(1);
  for (let round = 0; round < 3; round++) {
    await vi.advanceTimersByTimeAsync(MODEL_REFRESH_INTERVAL_MS);
    cache.refresh();
    await vi.advanceTimersByTimeAsync(0);
  }
  expect(detect).toHaveBeenCalledTimes(1);
  fingerprint = 'path-b:version-b:mtime-b';
  await vi.advanceTimersByTimeAsync(MODEL_REFRESH_INTERVAL_MS);
  cache.refresh();
  await vi.advanceTimersByTimeAsync(0);
  expect(detect).toHaveBeenCalledTimes(2);
  cache.invalidate();
  await vi.advanceTimersByTimeAsync(0);
  expect(detect).toHaveBeenCalledTimes(3);
  await cache.stop();
});
