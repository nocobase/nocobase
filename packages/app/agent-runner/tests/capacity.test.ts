import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { expect, it } from 'vitest';

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

it('expands occupied slots without restarting, applies tool changes, shrinks without stopping work and isolates applications', async () => {
  const first = new FakeServer();
  const second = new FakeServer({ app: { id: 'crm', name: 'CRM' } });
  first.capacity = { slots: 6, toolSlots: {} };
  second.capacity = { slots: 2, toolSlots: {} };
  await first.listen();
  await second.listen();
  const home = tempDir('runner-capacity-');
  const env = cliEnv(home);
  let daemon: Daemon | undefined;
  try {
    const fake = writeFakeCli(home);
    await registerRunner(first.url, env, ['--cli', 'appcli=' + fake]);
    await registerRunner(second.url, env, ['--cli', 'appcli=' + fake]);
    const settingsPath = path.join(home, 'settings.json');
    writeFileSync(
      settingsPath,
      JSON.stringify({
        ...JSON.parse(readFileSync(settingsPath, 'utf8')),
        slots: 6,
        toolSlots: { claude: 1 },
      }),
    );
    const queue = (server: FakeServer, count: number, prefix: string) =>
      Array.from({ length: count }, (_, index) =>
        server.enqueue({
          run: { id: prefix + index },
          prompt: {
            system: '',
            session: 'fresh',
            turn: 'say occupied\nwait-input',
          },
        }),
      );
    const a = queue(first, 8, 'a');
    const b = queue(second, 2, 'b');
    daemon = startDaemon(env);
    await waitFor(
      () =>
        a.filter((run) => run.status === 'running').length === 6 &&
        b.every((run) => run.status === 'running'),
      30_000,
      'independent occupied application slots',
    );
    expect(a.filter((run) => run.status === 'queued')).toHaveLength(2);
    const before = JSON.parse(
      (await cli(['status', '--json'], env)).stdout,
    ).result;
    const changedAt = Date.now();
    first.capacity = { slots: 8, toolSlots: { claude: 20 } };
    await waitFor(
      () => a.every((run) => run.status === 'running'),
      60_000,
      'eight running tasks without completing the first six',
    );
    expect(Date.now() - changedAt).toBeLessThan(60_000);
    const after = JSON.parse(
      (await cli(['status', '--json'], env)).stdout,
    ).result;
    expect(after.pid).toBe(before.pid);
    expect(
      after.apps.find((app: { key: string }) => app.key === 'test-app')
        .capacity,
    ).toMatchObject({ slots: 8, toolSlots: { claude: 8 }, source: 'online' });
    await waitFor(
      () => first.lastHeartbeat()?.load.slots === 8,
      10_000,
      'confirmation report',
    );
    first.capacity = { slots: 4, toolSlots: { claude: 2 } };
    await waitFor(
      () =>
        first.lastHeartbeat()?.load.slots === 4 &&
        first.lastHeartbeat()?.load.tools?.claude?.slots === 2,
      10_000,
      'reduced total and tool limits',
    );
    expect(first.lastHeartbeat()?.load.free).toBe(0);
    expect(a.every((run) => run.status === 'running')).toBe(true);
    first.capacity = { slots: 8, toolSlots: {} };
    await waitFor(
      () =>
        first.lastHeartbeat()?.load.slots === 8 &&
        !first.lastHeartbeat()?.load.tools,
      10_000,
      'cleared tool limits',
    );
    expect(
      JSON.parse(readFileSync(settingsPath, 'utf8')).slots,
    ).toBeUndefined();
  } finally {
    if (daemon) await stopDaemon(daemon);
    await first.close();
    await second.close();
    removeDir(home);
    removeDir(workRootOf(home));
  }
}, 90_000);

it('retains legacy settings across restarts until the last old server upgrades', async () => {
  const server = new FakeServer();
  server.capacity = undefined;
  const modern = new FakeServer({ app: { id: 'crm', name: 'CRM' } });
  modern.capacity = { slots: 8, toolSlots: {} };
  await modern.listen();
  await server.listen();
  const home = tempDir('runner-legacy-capacity-');
  const env = cliEnv(home);
  let daemon: Daemon | undefined;
  try {
    await registerRunner(server.url, env, [
      '--cli',
      'appcli=' + writeFakeCli(home),
    ]);
    await registerRunner(modern.url, env);
    const file = path.join(home, 'settings.json');
    writeFileSync(
      file,
      JSON.stringify({
        ...JSON.parse(readFileSync(file, 'utf8')),
        slots: 6,
        toolSlots: { claude: 3 },
      }),
    );
    for (let attempt = 0; attempt < 2; attempt += 1) {
      daemon = startDaemon(env);
      await waitFor(
        () =>
          server.lastHeartbeat()?.load.capacitySource === 'legacyLocal' &&
          server.lastHeartbeat()?.load.slots === 6,
        10_000,
        'legacy local capacity',
      );
      const status = JSON.parse(
        (await cli(['status', '--json'], env)).stdout,
      ).result;
      expect(
        status.apps.find((app: { key: string }) => app.key === 'test-app')
          .capacity,
      ).toMatchObject({
        slots: 6,
        source: 'legacyLocal',
      });
      expect(JSON.parse(readFileSync(file, 'utf8')).slots).toBe(6);
      if (attempt === 0) {
        await stopDaemon(daemon);
        daemon = undefined;
        const runner = [...server.runners.values()][0]!;
        runner.heartbeats.length = 0;
      }
    }
    server.capacity = { slots: 8, toolSlots: {} };
    await waitFor(
      () =>
        server.lastHeartbeat()?.load.capacitySource === 'online' &&
        server.lastHeartbeat()?.load.slots === 8,
      10_000,
      'online capacity after server upgrade',
    );
    expect(JSON.parse(readFileSync(file, 'utf8')).slots).toBeUndefined();
    expect(JSON.parse(readFileSync(file, 'utf8')).toolSlots).toBeUndefined();
  } finally {
    if (daemon) await stopDaemon(daemon);
    await server.close();
    await modern.close();
    removeDir(home);
    removeDir(workRootOf(home));
  }
});
