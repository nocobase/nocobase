import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

import type { RunJSSourceResolverInput } from '@nocobase/client-v2';

import type {
  ApiClientLike,
  ApiRequestOptions,
} from '@nocobase/plugin-light-extension/client-v2/api/lightExtensionEntriesRequests';
import { LightExtensionRuntimeCache } from '@nocobase/plugin-light-extension/client-v2/resolvers/LightExtensionRunJSResolver';

const artifactHash = 'a'.repeat(64);
const binding = { type: 'light-extension-entry', repoId: 'repo-1', entryId: 'entry-1', kind: 'js-action' } as const;

function input(settings: Record<string, unknown> = {}): RunJSSourceResolverInput {
  return { sourceMode: 'light-extension', sourceBinding: binding, settings };
}

function createApi(delayFirstPost = false) {
  const counters = { get: 0, post: 0 };
  let releaseFirstPost: (() => void) | undefined;
  const firstPost = new Promise<void>((resolve) => {
    releaseFirstPost = resolve;
  });
  const api: ApiClientLike = {
    async request<TResponse>(options: ApiRequestOptions): Promise<TResponse> {
      if (options.method === 'get') {
        counters.get += 1;
        return artifactResponse() as TResponse;
      }
      counters.post += 1;
      if (delayFirstPost && counters.post === 1) await firstPost;
      return resolveResponse((options.data as { settings?: Record<string, unknown> })?.settings || {}) as TResponse;
    },
  };
  return { api, counters, releaseFirstPost: () => releaseFirstPost?.() };
}

function resolveResponse(settings: Record<string, unknown>) {
  return {
    data: {
      data: {
        artifactHash,
        artifactUrl: `/api/light-extension-runtime/artifacts/${artifactHash}`,
        entryId: binding.entryId,
        entryPath: 'src/client/js-actions/example/index.ts',
        runtimeCodeHash: 'runtime-hash',
        settings,
        settingsHash: 'settings-hash',
        version: 'v2',
      },
    },
  };
}

function artifactResponse() {
  return {
    data: {
      artifactHash,
      byteSize: 32,
      code: 'return 1;',
      entryPath: 'src/client/js-actions/example/index.ts',
      runtimeCodeHash: 'runtime-hash',
      runtimeContract: 'light-extension.runtime-artifact.v1',
      sourceMap: null,
      version: 'v2',
    },
  };
}

function writeMeasurement(metrics: Record<string, unknown>): void {
  const output = process.env.RUNJS_PERF_SAMPLE_OUTPUT;
  if (!output) throw new Error('RUNJS_PERF_SAMPLE_OUTPUT is required');
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(
    output,
    `${JSON.stringify(
      { schemaVersion: 1, probe: 'runtime-resolve', phase: process.env.RUNJS_PERF_PHASE, metrics },
      null,
      2,
    )}\n`,
  );
}

describe('RunJS runtime resolve performance probe', () => {
  it('records cold sequential, cold concurrent, settings, and invalidation request counts', async () => {
    const sequential = createApi();
    const sequentialCache = new LightExtensionRuntimeCache();
    const sequentialStart = performance.now();
    for (let index = 0; index < 100; index += 1) {
      await sequentialCache.resolve(sequential.api, input(), binding);
    }
    const sequentialMs = performance.now() - sequentialStart;

    const concurrent = createApi();
    const concurrentCache = new LightExtensionRuntimeCache();
    const concurrentStart = performance.now();
    await Promise.all(Array.from({ length: 100 }, () => concurrentCache.resolve(concurrent.api, input(), binding)));
    const concurrentMs = performance.now() - concurrentStart;

    const settings = createApi();
    const settingsCache = new LightExtensionRuntimeCache();
    const settingsA = await settingsCache.resolve(settings.api, input({ label: 'A' }), binding);
    const settingsB = await settingsCache.resolve(settings.api, input({ label: 'B' }), binding);

    const invalidation = createApi(true);
    const invalidationCache = new LightExtensionRuntimeCache();
    const inFlight = invalidationCache.resolve(invalidation.api, input(), binding);
    await Promise.resolve();
    invalidationCache.invalidateRepo(binding.repoId);
    const afterInvalidate = invalidationCache.resolve(invalidation.api, input(), binding);
    invalidation.releaseFirstPost();
    await Promise.all([inFlight, afterInvalidate]);

    writeMeasurement({
      concurrent100: { ...concurrent.counters, wallTimeMs: concurrentMs },
      invalidateWithInFlight: invalidation.counters,
      sequential100: { ...sequential.counters, wallTimeMs: sequentialMs },
      settingsAB: { ...settings.counters, values: [settingsA.settings, settingsB.settings] },
    });
  });
});
