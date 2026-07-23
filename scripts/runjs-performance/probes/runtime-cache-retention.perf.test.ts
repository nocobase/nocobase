import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import type { RunJSSourceResolverInput } from '@nocobase/client-v2';

import type {
  ApiClientLike,
  ApiRequestOptions,
} from '@nocobase/plugin-light-extension/client-v2/api/lightExtensionEntriesRequests';
import type { LightExtensionRuntimeSourceBinding } from '@nocobase/plugin-light-extension/shared/types';
import { LightExtensionRuntimeCache } from '@nocobase/plugin-light-extension/client-v2/resolvers/LightExtensionRunJSResolver';

const durationMinutes = Number(process.env.RUNJS_PERF_DURATION_MINUTES || 30);

function writeMeasurement(metrics: Record<string, unknown>): void {
  const output = process.env.RUNJS_PERF_SAMPLE_OUTPUT;
  if (!output) throw new Error('RUNJS_PERF_SAMPLE_OUTPUT is required');
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(
    output,
    `${JSON.stringify(
      { schemaVersion: 1, probe: 'runtime-cache-retention', phase: process.env.RUNJS_PERF_PHASE, metrics },
      null,
      2,
    )}\n`,
  );
}

describe('RunJS runtime cache retention performance probe', () => {
  it(
    'records retained artifacts after a controlled idle period',
    async () => {
      const cache = new LightExtensionRuntimeCache();
      const api: ApiClientLike = {
        async request<TResponse>(options: ApiRequestOptions): Promise<TResponse> {
          const data = options.data as { sourceBinding?: { entryId?: string } } | undefined;
          const entryId =
            options.method === 'get' ? options.url.split('/').at(-1) || '' : String(data?.sourceBinding?.entryId || '');
          if (options.method === 'get') {
            return {
              data: {
                artifactHash: entryId,
                byteSize: 1024,
                code: `return ${JSON.stringify(entryId)};`,
                entryPath: `src/client/js-actions/${entryId}/index.ts`,
                runtimeCodeHash: entryId,
                runtimeContract: 'light-extension.runtime-artifact.v1',
                sourceMap: null,
                version: 'v2',
              },
            } as TResponse;
          }
          return {
            data: {
              data: {
                artifactHash: entryId,
                artifactUrl: `/api/light-extension-runtime/artifacts/${entryId}`,
                entryId,
                entryPath: `src/client/js-actions/${entryId}/index.ts`,
                runtimeCodeHash: entryId,
                settings: {},
                settingsHash: entryId,
                version: 'v2',
              },
            },
          } as TResponse;
        },
      };
      const before = process.memoryUsage().heapUsed;
      for (let index = 0; index < 500; index += 1) {
        const entryId = String(index).padStart(64, '0');
        const sourceBinding: LightExtensionRuntimeSourceBinding = {
          type: 'light-extension-entry',
          repoId: `repo-${index % 100}`,
          entryId,
          kind: 'js-action',
        };
        const request: RunJSSourceResolverInput = { sourceMode: 'light-extension', sourceBinding, settings: {} };
        await cache.resolve(api, request, sourceBinding);
      }
      const internal = cache as unknown as { artifacts: Map<string, unknown>; bindings: Map<string, unknown> };
      const artifactEntriesBeforeIdle = internal.artifacts.size;
      const filled = process.memoryUsage().heapUsed;
      if (process.env.RUNJS_PERF_PHASE === 'soak') {
        await new Promise((resolve) => setTimeout(resolve, durationMinutes * 60_000));
      }
      globalThis.gc?.();
      const afterIdle = process.memoryUsage().heapUsed;

      writeMeasurement({
        artifactCount: internal.artifacts.size,
        artifactEntriesAfterIdle: internal.artifacts.size,
        artifactEntriesBeforeIdle,
        bindingEntries: internal.bindings.size,
        durationMinutes: process.env.RUNJS_PERF_PHASE === 'soak' ? durationMinutes : 0,
        heapBytes: { afterIdle, before, filled, retained: Math.max(0, afterIdle - before) },
        idleMinutes: process.env.RUNJS_PERF_PHASE === 'soak' ? durationMinutes : 0,
        descriptorScopes: 100,
      });
    },
    Math.max(300_000, (durationMinutes + 2) * 60_000),
  );
});
