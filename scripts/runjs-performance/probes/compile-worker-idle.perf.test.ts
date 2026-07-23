import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

import { sha256Hex } from '@nocobase/runjs';

import {
  LIGHT_EXTENSION_AUTHORING_SURFACES,
  LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY,
  type LightExtensionCompileJob,
} from '@nocobase/plugin-light-extension/server/services/LightExtensionCompileContract';
import { buildLightExtensionCompileKey } from '@nocobase/plugin-light-extension/server/services/LightExtensionCompileKey';
import { LightExtensionCompileWorkerPool } from '@nocobase/plugin-light-extension/server/services/LightExtensionCompileWorkerPool';

const idleMinutes = Number(process.env.RUNJS_PERF_IDLE_MINUTES || 10);

function compileJob(): LightExtensionCompileJob {
  const content = 'ctx.render(<div>performance probe</div>);\n';
  const entryPath = 'src/client/js-blocks/performance-probe/index.tsx';
  const files = [{ path: entryPath, content, blobHash: sha256Hex(content), language: 'tsx', mode: '100644' }];
  const key = buildLightExtensionCompileKey({
    entry: {
      target: 'client',
      kind: 'js-block',
      entryPath,
      descriptorPath: 'src/client/js-blocks/performance-probe/entry.json',
    },
    files,
  });
  return {
    jobId: 'performance-probe',
    requestId: 'performance-probe',
    correlationId: 'performance-probe',
    repoId: 'performance-probe',
    entryId: 'performance-probe',
    entryName: 'performance-probe',
    ordinal: 0,
    compileKey: key.compileKey,
    filesHash: key.filesHash,
    kind: 'js-block',
    entryPath,
    runtimeVersion: 'v2',
    surface: structuredClone(LIGHT_EXTENSION_AUTHORING_SURFACES['js-block']),
    compilerBuildIdentity: structuredClone(LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY),
    inputManifest: key.inputManifest,
    files,
  };
}

function writeMeasurement(metrics: Record<string, unknown>): void {
  const output = process.env.RUNJS_PERF_SAMPLE_OUTPUT;
  if (!output) throw new Error('RUNJS_PERF_SAMPLE_OUTPUT is required');
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(
    output,
    `${JSON.stringify(
      { schemaVersion: 1, probe: 'compile-worker-idle', phase: process.env.RUNJS_PERF_PHASE, metrics },
      null,
      2,
    )}\n`,
  );
}

describe('Light Extension compile worker idle performance probe', () => {
  it(
    'records first submit and post-idle RSS',
    async () => {
      const preCompileRss = process.memoryUsage().rss;
      const constructStart = performance.now();
      const pool = new LightExtensionCompileWorkerPool();
      const constructMs = performance.now() - constructStart;
      const submitStart = performance.now();
      const result = await pool.submit(compileJob());
      const submitMs = performance.now() - submitStart;
      const postCompileRss = process.memoryUsage().rss;
      if (process.env.RUNJS_PERF_PHASE === 'soak') {
        await new Promise((resolve) => setTimeout(resolve, idleMinutes * 60_000));
      }
      const postIdleRss = process.memoryUsage().rss;
      const workerCount = pool.getMetrics().workerCount;
      await pool.shutdown();
      expect(result.accepted).toBe(true);
      writeMeasurement({
        accepted: result.accepted,
        artifactHash: result.artifactHash,
        constructMs,
        idleMinutes: process.env.RUNJS_PERF_PHASE === 'soak' ? idleMinutes : 0,
        postCompileRss,
        postIdleRss,
        preCompileRss,
        retainedRssBytes: Math.max(0, postIdleRss - preCompileRss),
        submitMs,
        workerCount,
      });
    },
    Math.max(300_000, (idleMinutes + 2) * 60_000),
  );
});
