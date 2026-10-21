import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
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

it('runs a catalog tool through a real daemon and worker with the prepared environment, then applies a changed selection', async () => {
  const server = new FakeServer({ requireAuthentication: true });
  server.enabledTools = ['gemini'];
  const home = tempDir('acp-daemon-');
  const toolDir = path.join(home, 'tools');
  mkdirSync(toolDir);
  const launcher = path.join(toolDir, 'gemini');
  const fixture = path.resolve(import.meta.dirname, 'fixtures/acp-agent.mjs');
  writeFileSync(
    launcher,
    `#!/bin/sh\nexec '${process.execPath}' '${fixture}' "$@"\n`,
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
