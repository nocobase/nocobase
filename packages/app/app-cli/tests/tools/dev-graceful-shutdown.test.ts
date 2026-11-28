// @vitest-environment node
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const supervisor = new URL(
  '../../src/tools/scripts/dev/supervisor.mjs',
  import.meta.url,
).href;
const processes: ChildProcess[] = [];
const directories: string[] = [];

async function waitFor(check: () => Promise<boolean>) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
  throw new Error('Timed out waiting for graceful development shutdown');
}

async function fixture(stubborn = false) {
  const root = await mkdtemp(path.join(tmpdir(), 'dev-graceful-shutdown-'));
  directories.push(root);
  const log = path.join(root, 'events.jsonl');
  await writeFile(log, '');
  const server = path.join(root, 'server.mjs');
  await writeFile(
    server,
    `
    import { appendFileSync } from 'node:fs';
    const record = (event) => appendFileSync(${JSON.stringify(log)}, JSON.stringify({event, pid: process.pid}) + '\\n');
    let stopping = false;
    process.on('SIGTERM', () => {
      record('signal');
      if (stopping) { record('duplicate'); process.exit(1); }
      stopping = true;
      // Longer than the former supervisor's 1.8-second escalation deadline.
      setTimeout(() => { record('released'); process.exit(0); }, 2200);
    });
    setInterval(() => {}, 1000);
    record('ready');
  `,
  );
  const entry = path.join(root, 'worker.mjs');
  await writeFile(
    entry,
    `
    import { spawn } from 'node:child_process';
    const child = spawn(process.execPath, [${JSON.stringify(require.resolve('tsx/cli'))}, 'watch', '--clear-screen=false', ${JSON.stringify(server)}], { stdio: ['pipe', 'inherit', 'inherit'] });
    // Like the development worker, forward once to each immediate command, not its descendants.
    let stopping = false;
    process.on('SIGTERM', () => { if (${stubborn}) return; if (!stopping) { stopping = true; child.kill('SIGTERM'); } });
    child.once('exit', (code) => process.exit(code ?? 1));
  `,
  );
  const launcher = path.join(root, 'launcher.mjs');
  await writeFile(
    launcher,
    `
    import { superviseDevelopment } from ${JSON.stringify(supervisor)};
    process.exitCode = await superviseDevelopment({ rootDir: ${JSON.stringify(root)}, entry: ${JSON.stringify(entry)} });
  `,
  );
  const child = spawn(
    process.execPath,
    ['--import', require.resolve('tsx'), launcher],
    {
      cwd: path.resolve(import.meta.dirname, '..', '..'),
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  processes.push(child);
  let output = '';
  child.stdout?.on('data', (chunk) => {
    output += chunk;
  });
  child.stderr?.on('data', (chunk) => {
    output += chunk;
  });
  const closed = new Promise<number | null>((resolve) =>
    child.once('close', resolve),
  );
  const events = async (): Promise<Array<{ event: string; pid: number }>> =>
    (await readFile(log, 'utf8'))
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  await waitFor(async () =>
    (await events()).some(({ event }) => event === 'ready'),
  );
  return { root, child, closed, events, output: () => output };
}

afterEach(async () => {
  for (const child of processes.splice(0)) {
    if (child.exitCode === null && child.signalCode === null) {
      const closed = new Promise<void>((resolve) =>
        child.once('close', () => resolve()),
      );
      child.kill('SIGTERM');
      await closed;
    }
  }
  for (const directory of directories.splice(0))
    await rm(directory, { recursive: true, force: true });
});

it.skipIf(process.platform === 'win32')(
  'lets a real tsx watcher forward one shutdown signal and finish releasing resources',
  async () => {
    const { child, closed, events, output } = await fixture();
    child.kill('SIGTERM');
    expect(await closed).toBe(0);
    expect(output()).not.toContain('shutdown timed out');
    expect((await events()).map(({ event }) => event)).toEqual([
      'ready',
      'signal',
      'released',
    ]);
  },
);

it.skipIf(process.platform === 'win32')(
  'waits for resource release before starting the next dotenv generation',
  async () => {
    const { root, events } = await fixture();
    await writeFile(path.join(root, '.env.local'), 'RESTART=1\n');
    await waitFor(
      async () =>
        (await events()).filter(({ event }) => event === 'ready').length === 2,
    );
    const history = await events();
    expect(history.map(({ event }) => event)).toEqual([
      'ready',
      'signal',
      'released',
      'ready',
    ]);
    expect(history[0].pid).not.toBe(history[3].pid);
  },
);

it.skipIf(process.platform === 'win32')(
  'force-reaps the group when a worker never forwards its graceful signal',
  async () => {
    const { child, closed, events, output } = await fixture(true);
    const pid = (await events())[0].pid;
    child.kill('SIGTERM');
    await closed;
    expect(output()).toContain('Development shutdown timed out');
    expect((await events()).map(({ event }) => event)).toEqual(['ready']);
    expect(() => process.kill(pid, 0)).toThrow();
  },
);
