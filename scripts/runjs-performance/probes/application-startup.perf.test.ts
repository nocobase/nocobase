import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

import { createMockServer } from '@nocobase/test';

function writeMeasurement(metrics: Record<string, unknown>): void {
  const output = process.env.RUNJS_PERF_SAMPLE_OUTPUT;
  if (!output) throw new Error('RUNJS_PERF_SAMPLE_OUTPUT is required');
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(
    output,
    `${JSON.stringify(
      { schemaVersion: 1, probe: 'application-startup', phase: process.env.RUNJS_PERF_PHASE, metrics },
      null,
      2,
    )}\n`,
  );
}

describe('NocoBase application startup performance probe', () => {
  it('records a common server application bootstrap', async () => {
    const beforeRssBytes = process.memoryUsage().rss;
    const started = performance.now();
    const app = await createMockServer();
    const wallTimeMs = performance.now() - started;
    const afterRssBytes = process.memoryUsage().rss;
    await app.destroy();
    writeMeasurement({
      afterRssBytes,
      beforeRssBytes,
      rssDeltaBytes: Math.max(0, afterRssBytes - beforeRssBytes),
      wallTimeMs,
    });
  });
});
