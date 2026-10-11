import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { FakeServer, waitFor } from './fake-server.ts';
import {
  cli,
  cliEnv,
  registerRunner,
  removeDir,
  startDaemon,
  stopDaemon,
  tempDir,
  workRootOf,
  writeFakeCli,
  type Daemon,
} from './helpers.ts';

describe('local provider authentication', () => {
  const homes: string[] = [];
  const servers: FakeServer[] = [];
  const daemons: Daemon[] = [];
  afterEach(async () => {
    for (const daemon of daemons.splice(0)) await stopDaemon(daemon);
    for (const server of servers.splice(0)) await server.close();
    for (const home of homes.splice(0)) {
      removeDir(home);
      removeDir(workRootOf(home));
    }
  });

  it('dispatches and executes with only an env set key, refreshing detection without sharing it with another app', async () => {
    const home = tempDir('local-provider-');
    homes.push(home);
    const fixture = readFileSync(
      new URL('./fixtures/provider-pi.mjs', import.meta.url),
      'utf8',
    );
    writeFileSync(path.join(home, 'pi'), `#!${process.execPath}\n${fixture}`, {
      mode: 0o700,
    });
    const env = cliEnv(home, {
      PATH: home,
      HOME: home,
      NOCOBASE_RUNNER_ADAPTER: '',
    });
    const first = new FakeServer({ requireAuthentication: true });
    const second = new FakeServer({
      app: { id: 'other-app', name: 'Other' },
      requireAuthentication: true,
    });
    servers.push(first, second);
    await first.listen();
    await second.listen();
    const fakeCli = writeFakeCli(home);
    for (const server of servers)
      await registerRunner(server.url, env, ['--cli', `appcli=${fakeCli}`]);
    expect(first.runners.values().next().value?.register.tools).toContainEqual(
      expect.objectContaining({ kind: 'pi', authenticated: false }),
    );
    const tool = {
      kind: 'pi' as const,
      model: 'custom/demo',
      policy: {
        permissionMode: 'acceptEdits' as const,
        allowedCommands: [],
        deniedPatterns: [],
        idleTimeoutMs: 10_000,
      },
    };
    const workspace = {
      dirs: [],
      env: [],
      passthrough: ['LOCAL_PROVIDER_KEY'],
    };
    const run = first.enqueue({
      tool,
      workspace,
      subject: { key: 'local-provider', title: 'Local provider' },
    });
    const isolated = second.enqueue({ tool, workspace });
    const daemon = startDaemon(env);
    daemons.push(daemon);
    await waitFor(() => first.lastHeartbeat(), 10_000, 'initial detection');
    expect(run.status).toBe('queued');

    const set = await cli(
      ['env', 'set', 'LOCAL_PROVIDER_KEY', '--server', first.url],
      env,
      { input: 'synthetic-key' },
    );
    expect(set).toMatchObject({ code: 0 });
    await waitFor(
      () => run.status === 'completed' || run.status === 'failed',
      15_000,
      'provider run',
    );
    expect(run.fail).toBeUndefined();
    expect(run.complete?.summary).toBe('local provider authenticated');
    expect(first.lastHeartbeat()?.tools).toContainEqual(
      expect.objectContaining({ kind: 'pi', authenticated: true }),
    );
    expect(second.lastHeartbeat()?.tools).toContainEqual(
      expect.objectContaining({ kind: 'pi', authenticated: false }),
    );
    expect(isolated.status).toBe('queued');
    expect(JSON.stringify(first.lastHeartbeat())).not.toContain(
      'synthetic-key',
    );

    const unset = await cli(
      ['env', 'unset', 'LOCAL_PROVIDER_KEY', '--server', first.url],
      env,
    );
    expect(unset).toMatchObject({ code: 0 });
    await waitFor(
      () =>
        first
          .lastHeartbeat()
          ?.tools.some((entry) => entry.kind === 'pi' && !entry.authenticated),
      10_000,
      'detection after removing key',
    );
    expect(first.lastHeartbeat()?.variables).not.toContain(
      'LOCAL_PROVIDER_KEY',
    );

    // Re-registration must detect the stored key before the first heartbeat as well.
    expect(
      (
        await cli(
          ['env', 'set', 'LOCAL_PROVIDER_KEY', '--server', first.url],
          env,
          { input: 'synthetic-key' },
        )
      ).code,
    ).toBe(0);
    first.registrationTokens.add('reg-token');
    await registerRunner(first.url, env, [
      '--force',
      '--cli',
      `appcli=${fakeCli}`,
    ]);
    expect([...first.runners.values()].at(-1)?.register.tools).toContainEqual(
      expect.objectContaining({ kind: 'pi', authenticated: true }),
    );
  }, 30_000);

  it('refreshes authentication after env unset removes a passed name from a running daemon', async () => {
    const home = tempDir('passed-provider-');
    homes.push(home);
    const fixture = readFileSync(
      new URL('./fixtures/provider-pi.mjs', import.meta.url),
      'utf8',
    );
    writeFileSync(path.join(home, 'pi'), `#!${process.execPath}\n${fixture}`, {
      mode: 0o700,
    });
    const env = cliEnv(home, {
      PATH: home,
      HOME: home,
      NOCOBASE_RUNNER_ADAPTER: '',
      LOCAL_PROVIDER_KEY: 'synthetic-key',
    });
    const server = new FakeServer({ requireAuthentication: true });
    servers.push(server);
    await server.listen();
    await registerRunner(server.url, env);
    const daemon = startDaemon(env, ['--pass-env', 'LOCAL_PROVIDER_KEY']);
    daemons.push(daemon);
    await waitFor(
      () =>
        server
          .lastHeartbeat()
          ?.tools.some((entry) => entry.kind === 'pi' && entry.authenticated),
      10_000,
      'passed provider detection',
    );
    expect((await cli(['env', 'unset', 'LOCAL_PROVIDER_KEY'], env)).code).toBe(
      0,
    );
    await waitFor(
      () =>
        server
          .lastHeartbeat()
          ?.tools.some((entry) => entry.kind === 'pi' && !entry.authenticated),
      10_000,
      'detection after forgetting passed name',
    );
    expect(server.lastHeartbeat()?.variables).not.toContain(
      'LOCAL_PROVIDER_KEY',
    );
  }, 20_000);
});
