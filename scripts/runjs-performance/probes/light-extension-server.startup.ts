import { performance } from 'node:perf_hooks';

async function main() {
  const mode = process.argv[2];
  if (mode !== 'disabled' && mode !== 'enabled') {
    throw new Error('Expected disabled or enabled startup mode');
  }

  const started = performance.now();
  const rssBeforeBytes = process.memoryUsage().rss;
  const { createMockServer } = await import('@nocobase/test');
  const plugins = mode === 'enabled' ? [(await import('@nocobase/plugin-light-extension/server')).default] : undefined;
  const moduleLoadMs = performance.now() - started;
  const bootstrapStarted = performance.now();
  const app = await createMockServer({ plugins });
  const bootstrapMs = performance.now() - bootstrapStarted;
  const rssDeltaBytes = Math.max(0, process.memoryUsage().rss - rssBeforeBytes);

  try {
    process.stdout.write(
      `RUNJS_PERF_STARTUP_RESULT=${JSON.stringify({
        bootstrapMs,
        isolatedProcess: true,
        moduleLoadMs,
        rssDeltaBytes,
        wallTimeMs: performance.now() - started,
      })}\n`,
    );
  } finally {
    await app.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
