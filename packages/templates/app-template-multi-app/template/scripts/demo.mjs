import { networkInterfaces } from 'node:os';
import { spawn } from 'node:child_process';
import { loadEnvFile } from 'node:process';
import { readDemoPlan } from './demo-plan.mjs';
import { assertHostStopSupport } from './check-host-stop.mjs';
try {
  loadEnvFile(new URL('../.env.local', import.meta.url));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
// Local Host traffic must not be sent through a machine-wide HTTP proxy.
const localAddresses = Object.values(networkInterfaces())
  .flat()
  .filter((a) => a?.family === 'IPv4')
  .map((a) => a.address);
let proxyEnvironmentChanged = false;
for (const key of ['NO_PROXY', 'no_proxy']) {
  const value = [
    ...new Set([
      ...(process.env[key] ?? '').split(','),
      'localhost',
      '127.0.0.1',
      ...localAddresses,
    ]),
  ]
    .filter(Boolean)
    .join(',');
  proxyEnvironmentChanged ||= process.env[key] !== value;
  process.env[key] = value;
}
// Node constructs its environment-aware HTTP agent before this file runs.
// Re-exec once with the completed exclusions; changing process.env is too late.
if (proxyEnvironmentChanged && process.env.NODE_USE_ENV_PROXY === '1') {
  const child = spawn(
    process.execPath,
    [...process.execArgv, ...process.argv.slice(1)],
    {
      stdio: 'inherit',
      env: process.env,
    },
  );
  for (const signal of ['SIGINT', 'SIGTERM'])
    process.on(signal, () => child.kill(signal));
  const code = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
  process.exit(code);
}
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log(
    'demo: start the built Main App. --initialize --plan <file.json> explicitly publishes artifacts, provisions instances and grants membership.',
  );
  process.exit(0);
}
const initialize =
  args[0] === '--initialize' && args[1] === '--plan' && args.length === 3;
if (args.length && !initialize)
  throw new Error(
    'Use --initialize --plan <file.json>, or no arguments to start without initialization.',
  );
const plan = initialize ? await readDemoPlan(args[2]) : undefined;
if (initialize) await assertHostStopSupport();
const { createStandaloneServer } = await import('../dist/server/standalone.js');
const { startNodeAppServer } = await import(
  import.meta.resolve(
    '@nocobase/app-server/node',
    new URL('../dist/package.json', import.meta.url).href,
  )
);
const runtime = await createStandaloneServer({ viteDevUrl: false });
await startNodeAppServer(runtime, {
  ...runtime.listenOptions,
  registerProcessSignals: true,
});
try {
  if (plan) {
    const { prepareDemo } = await import('./prepare-demo.mjs');
    await prepareDemo(runtime.application, plan);
    console.log(
      'Explicit demo initialization finished; existing instances were retained.',
    );
  }
  console.log(
    'Main App is running. No initialization occurs without --initialize --plan.',
  );
} catch (error) {
  console.error('Demo setup did not finish:', error.message);
  process.exitCode = 1;
}
