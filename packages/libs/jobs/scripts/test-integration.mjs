// Runs the Redis integration suite against a disposable Redis in its own
// Compose project, then removes the project whether the suite passed or not.
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const composeFile = fileURLToPath(
  new URL('../docker-compose.yml', import.meta.url),
);
const projectName = `nocobase-schedule-redis-${randomBytes(4).toString('hex')}`;
const keep = process.env.KEEP_TEST_REDIS === '1';
let active;
let receivedSignal;

function run(command, args, { capture = false, env = process.env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
      env,
    });
    active = child;
    let output = '';
    child.stdout?.on('data', (chunk) => {
      output += String(chunk);
    });
    child.once('error', reject);
    child.once('close', (code, signal) => {
      active = undefined;
      resolve({ code: code ?? 1, signal, output });
    });
  });
}

const compose = (args, options) =>
  run(
    'docker',
    ['compose', '--project-name', projectName, '--file', composeFile, ...args],
    options,
  );

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    receivedSignal = signal;
    active?.kill(signal);
  });
}

let exitCode;
try {
  console.error(`[schedule] Starting Redis in ${projectName}.`);
  const up = await compose(['up', '--detach', '--wait', 'redis']);
  if (up.code !== 0)
    throw new Error(`docker compose up exited with ${up.code}`);
  const port = await compose(['port', 'redis', '6379'], { capture: true });
  const match = /:(\d+)\s*$/u.exec(port.output.trim());
  if (!match)
    throw new Error(
      `Cannot read the published Redis port from "${port.output}".`,
    );
  const result = await run(
    'pnpm',
    [
      'exec',
      'vitest',
      'run',
      'tests/integration',
      '--reporter=verbose',
      ...process.argv.slice(2),
    ],
    {
      env: { ...process.env, REDIS_HOST: '127.0.0.1', REDIS_PORT: match[1] },
    },
  );
  exitCode = receivedSignal ? 130 : result.code;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  exitCode = 1;
} finally {
  if (keep) {
    console.error(`[schedule] Keeping ${projectName} for inspection.`);
  } else {
    await compose(['down', '--volumes', '--remove-orphans']);
  }
}
process.exitCode = exitCode;
