import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, it } from 'vitest';
import { FakeServer, waitFor } from './fake-server.ts';
import {
  cliEnv,
  registerRunner,
  removeDir,
  startDaemon,
  stopDaemon,
  tempDir,
  workRootOf,
} from './helpers.ts';

it('uses cached detection for successive tasks and releases the slot when session opening hangs, then applies a changed selection', async () => {
  const server = new FakeServer({ requireAuthentication: true });
  server.enabledTools = ['gemini'];
  const home = tempDir('acp-daemon-');
  const toolDir = path.join(home, 'tools');
  mkdirSync(toolDir);
  const launcher = path.join(toolDir, 'gemini');
  const fixture = path.resolve(import.meta.dirname, 'fixtures/acp-agent.mjs');
  const trace = path.join(home, 'trace');
  const variant = path.join(home, 'variant');
  const pidFile = path.join(home, 'agent-pid');
  writeFileSync(variant, '');
  const messages = () =>
    existsSync(trace)
      ? readFileSync(trace, 'utf8')
          .trim()
          .split('\n')
          .map((line) => JSON.parse(line))
      : [];
  const calls = (method: string) =>
    messages().filter((message) => message.method === method).length;
  writeFileSync(
    launcher,
    `#!${process.execPath}\nimport { readFileSync } from 'node:fs';\nprocess.env.ACP_FIXTURE_TRACE = ${JSON.stringify(trace)};\nprocess.env.ACP_FIXTURE_PID = ${JSON.stringify(pidFile)};\nprocess.env.ACP_FIXTURE_VARIANT = readFileSync(${JSON.stringify(variant)}, 'utf8');\nawait import(${JSON.stringify(pathToFileURL(fixture).href)});\n`,
  );
  chmodSync(launcher, 0o755);
  const cliFile = path.join(home, 'appcli.mjs');
  writeFileSync(cliFile, "process.stdout.write('test CLI');\n");
  const env = cliEnv(home, {
    NOCOBASE_RUNNER_ADAPTER: '',
    HOME: home,
    PATH: `${toolDir}${path.delimiter}${process.env.PATH}`,
  });
  let daemon;
  try {
    await server.listen();
    await registerRunner(server.url, env, ['--cli', `appcli=${cliFile}`]);
    expect([...server.runners.values()][0]!.register.tools).toEqual([]);
    daemon = startDaemon(env);
    await waitFor(
      () =>
        server
          .lastHeartbeat()
          ?.tools.some((tool) => tool.kind === 'gemini' && tool.authenticated),
      10_000,
      'ACP detection',
    );
    expect(server.lastHeartbeat()?.tools.map((tool) => tool.kind)).toEqual([
      'gemini',
    ]);
    expect([...server.runners.values()][0]!.heartbeats[0]!.tools).toEqual([]);
    const run = server.enqueue({
      tool: {
        kind: 'gemini',
        model: 'two',
        policy: {
          permissionMode: 'acceptEdits',
          allowedCommands: [],
          deniedPatterns: [],
          idleTimeoutMs: 60_000,
        },
      },
      prompt: {
        system: 'Runtime instructions',
        turn: 'Task to perform',
        session: 'fresh',
      },
    });
    await waitFor(
      () => run.status === 'completed' || run.status === 'failed',
      10_000,
      'ACP task',
    ).catch((error) => {
      throw new Error(
        `${String(error)}; status=${run.status}; failure=${JSON.stringify(run.fail)}; ${daemon!.output()}`,
      );
    });
    expect(run.fail).toBeUndefined();
    expect(run.complete?.usage).toEqual([]);
    expect(
      [...run.events.values()].map((event) => event.content).join('\n'),
    ).toContain('Runtime instructions');
    expect(
      [...run.events.values()].map((event) => event.content).join('\n'),
    ).toContain('Task to perform');
    expect(
      [...run.events.values()].map((event) => event.content).join('\n'),
    ).toContain(`cwd=${run.start!.workDir}`);
    expect(run.start?.adapter).toEqual({ kind: 'gemini', version: '1.2.3' });
    const next = server.enqueue({ tool: run.payload.tool });
    await waitFor(() => next.status === 'completed', 10_000, 'second ACP task');
    // One startup inspection and one real ACP session for each task, without worker inspections.
    expect(calls('initialize')).toBe(3);
    expect(calls('session/new')).toBe(3);
    expect(calls('session/prompt')).toBe(2);
    writeFileSync(variant, 'hangOpen');
    const hung = server.enqueue({ tool: run.payload.tool });
    await waitFor(
      () => calls('session/new') === 4,
      10_000,
      'hung session opening',
    );
    expect(hung.status).toBe('running');
    const hungPid = Number(readFileSync(pidFile, 'utf8'));
    writeFileSync(variant, '');
    const recovered = server.enqueue({ tool: run.payload.tool });
    expect(recovered.status).toBe('queued');
    server.cancel(hung.payload.run.id);
    await waitFor(
      () => hung.status === 'cancelled',
      5_000,
      'cancel hung ACP opening',
    );
    await waitFor(
      () => {
        try {
          process.kill(hungPid, 0);
          return false;
        } catch {
          return true;
        }
      },
      5_000,
      'reap hung ACP process',
    );
    await waitFor(
      () => recovered.status === 'completed',
      10_000,
      'reuse released slot',
    );
    expect(hung.cancelAck).toBeDefined();
    expect(daemon.output()).not.toContain('worker did not stop');
    expect(calls('initialize')).toBe(5);
    expect(calls('session/new')).toBe(5);
    expect(calls('session/prompt')).toBe(3);
    server.enabledTools = [];
    await waitFor(
      () => server.lastHeartbeat()?.tools.length === 0,
      10_000,
      'selection changed',
    );
  } finally {
    if (daemon) await stopDaemon(daemon);
    await server.close();
    removeDir(home);
    removeDir(workRootOf(home));
  }
}, 30_000);
