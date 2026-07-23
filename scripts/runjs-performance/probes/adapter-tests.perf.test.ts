import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';

import { afterAll, expect, test, vi } from 'vitest';

type Lane = 'flow' | 'workflow';
type LaneMetrics = { bootstrapCount: number; bootstrapMs: number[]; sessionCount: number };

const lane = vi.hoisted(() => {
  const value = process.env.RUNJS_PERF_ADAPTER_LANE as Lane;
  if (value !== 'flow' && value !== 'workflow') throw new Error('RUNJS_PERF_ADAPTER_LANE must be flow or workflow');
  return value;
});
const metrics = vi.hoisted(() => ({ bootstrapCount: 0, bootstrapMs: [], sessionCount: 0 }) as LaneMetrics);

function trackSessions<T extends { agent: (...args: never[]) => unknown }>(app: T): T {
  const agent = app.agent.bind(app);
  Object.defineProperty(app, 'agent', {
    configurable: true,
    value: (...args: never[]) => {
      metrics.sessionCount += 1;
      return agent(...args);
    },
  });
  return app;
}

vi.mock('@nocobase/test', async (importOriginal) => {
  const original = await importOriginal<typeof import('@nocobase/test')>();
  return {
    ...original,
    createMockServer: async (...args: Parameters<typeof original.createMockServer>) => {
      const started = performance.now();
      const app = await original.createMockServer(...args);
      if (lane === 'flow') {
        metrics.bootstrapCount += 1;
        metrics.bootstrapMs.push(performance.now() - started);
        trackSessions(app);
      }
      return app;
    },
  };
});

vi.mock('@nocobase/plugin-workflow-test', async (importOriginal) => {
  const original = await importOriginal<typeof import('@nocobase/plugin-workflow-test')>();
  return {
    ...original,
    getApp: async (...args: Parameters<typeof original.getApp>) => {
      const started = performance.now();
      const app = await original.getApp(...args);
      metrics.bootstrapCount += 1;
      metrics.bootstrapMs.push(performance.now() - started);
      return trackSessions(app);
    },
  };
});

const suites = {
  flow: 'packages/plugins/@nocobase/plugin-flow-engine/src/server/__tests__/runjs-sources.adapters.test.ts',
  workflow: 'packages/plugins/@nocobase/plugin-workflow-javascript/src/server/__tests__/runjs-source-adapter.test.ts',
} as const;

await import(/* @vite-ignore */ pathToFileURL(path.join(process.cwd(), suites[lane])).href);

function writeMeasurement(): void {
  const output = process.env.RUNJS_PERF_SAMPLE_OUTPUT;
  if (!output) throw new Error('RUNJS_PERF_SAMPLE_OUTPUT is required');
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(
    output,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        probe: 'adapter-tests',
        phase: process.env.RUNJS_PERF_PHASE,
        metrics: { ...metrics, file: suites[lane], lane },
      },
      null,
      2,
    )}\n`,
  );
}

test('records actual App/DB bootstrap and session counts for adapter suites', () => {
  expect(metrics.bootstrapCount).toBeGreaterThan(0);
});

afterAll(() => {
  writeMeasurement();
});
