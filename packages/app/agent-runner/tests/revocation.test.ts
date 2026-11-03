import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { createEchoAdapter } from '../src/agent/adapters/echo.ts';
import { RunnerDaemon } from '../src/core/loop.ts';
import {
  readConnections,
  readSettings,
  markRevoked,
} from '../src/lib/config.ts';
import { runnerPaths } from '../src/lib/home.ts';
import { RUNNER_ROUTES } from '../src/protocol/index.ts';
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
} from './helpers.ts';

const reasons = ['RUNNER_REVOKED', 'RUNNER_KEY_INVALID'] as const;

describe('permanent runner revocation', () => {
  it.each(
    reasons.flatMap((reason) =>
      [RUNNER_ROUTES.heartbeat, RUNNER_ROUTES.claim].map((route) => ({
        reason,
        route,
      })),
    ),
  )(
    'persists $reason from $route, exits 3 and blocks further starts locally',
    async ({ reason, route }) => {
      const home = tempDir();
      const env = cliEnv(home);
      const server = new FakeServer();
      await server.listen();
      try {
        await registerRunner(server.url, env);
        server.authFailure = { route, reason };
        const daemon = startDaemon(env);
        expect(await daemon.exited).toBe(3);
        expect(daemon.output().trim().split('\n').at(-1)).toContain(
          'Runner revoked. Run nocobase-runner register to register again.',
        );
        const registration = JSON.parse(
          readFileSync(path.join(home, 'apps/test-app.json'), 'utf8'),
        );
        expect(registration.revoked).toEqual({
          at: expect.any(String),
          reason,
        });
        expect(Date.parse(registration.revoked.at)).not.toBeNaN();
        if (route === RUNNER_ROUTES.heartbeat)
          expect(daemon.output()).not.toContain('gc:');
        const before = server.requests;
        for (const args of [['start', '--foreground'], ['start']]) {
          const result = await cli(args, env);
          expect(result.code).toBe(3);
          expect(result.stderr).toContain('register again');
        }
        expect(server.requests).toBe(before);
        const status = JSON.parse(
          (await cli(['status', '--json'], env)).stdout,
        );
        expect(status.result.apps[0].revoked).toEqual(registration.revoked);
        const supervised = await cli(['service', 'run'], env);
        expect(supervised.code).toBe(process.platform === 'darwin' ? 0 : 3);
        expect(
          readFileSync(path.join(home, 'logs/runner.log'), 'utf8'),
        ).toContain('register again');
        expect(server.requests).toBe(before);
        await server.close();
        expect((await cli(['start', '--foreground'], env)).code).toBe(3);
      } finally {
        await server.close();
        removeDir(home);
        removeDir(workRootOf(home));
      }
    },
  );

  it('keeps serving the other application, then stops when both are revoked', async () => {
    const home = tempDir();
    const env = cliEnv(home);
    const first = new FakeServer();
    const second = new FakeServer({ app: { id: 'second', name: 'Second' } });
    await first.listen();
    await second.listen();
    let daemon: ReturnType<typeof startDaemon> | undefined;
    try {
      await registerRunner(first.url, env);
      await registerRunner(second.url, env);
      first.authFailure = {
        route: RUNNER_ROUTES.heartbeat,
        reason: 'RUNNER_REVOKED',
      };
      daemon = startDaemon(env);
      await waitFor(() => (second.runners.get('runner-1')?.claims ?? 0) > 1);
      expect(daemon.child.exitCode).toBeNull();
      expect(first.runners.get('runner-1')?.claims).toBe(0);
      second.authFailure = {
        route: RUNNER_ROUTES.heartbeat,
        reason: 'RUNNER_KEY_INVALID',
      };
      expect(await daemon.exited).toBe(3);
    } finally {
      if (daemon) await stopDaemon(daemon);
      await first.close();
      await second.close();
      removeDir(home);
      removeDir(workRootOf(home));
    }
  });

  it('clears the marker only after successful registration, preserves local configuration and starts again', async () => {
    const home = tempDir();
    const env = cliEnv(home);
    const server = new FakeServer();
    await server.listen();
    try {
      await registerRunner(server.url, env);
      const paths = runnerPaths(home, workRootOf(home));
      const connection = (await readConnections(paths))[0]!;
      await cli(['env', 'set', 'LOCAL_VALUE', 'local'], env);
      await markRevoked(connection.registration, 'RUNNER_REVOKED', paths);
      expect(
        (await cli(['register', '--server', server.url, '--token', 'bad'], env))
          .code,
      ).toBe(3);
      expect(
        (await readConnections(paths))[0]?.registration.revoked,
      ).toBeDefined();
      server.registrationTokens.add('reg-token');
      await registerRunner(server.url, env);
      const restored = (await readConnections(paths))[0]!.registration;
      expect(restored.revoked).toBeUndefined();
      expect(restored.variables).toEqual({ LOCAL_VALUE: 'local' });
      const daemon = startDaemon(env);
      try {
        await waitFor(() => (server.runners.get('runner-2')?.claims ?? 0) > 0);
      } finally {
        await stopDaemon(daemon);
      }
    } finally {
      await server.close();
      removeDir(home);
      removeDir(workRootOf(home));
    }
  });

  it('does not detect tools, collect garbage or send HTTP for locally revoked registrations', async () => {
    const home = tempDir();
    const paths = runnerPaths(home, workRootOf(home));
    const server = new FakeServer();
    await server.listen();
    try {
      await registerRunner(server.url, cliEnv(home));
      const connections = await readConnections(paths);
      connections[0]!.registration.revoked = {
        at: new Date().toISOString(),
        reason: 'RUNNER_REVOKED',
      };
      const detect = vi.fn();
      const readDisk = vi.fn();
      const before = server.requests;
      const daemon = new RunnerDaemon({
        paths,
        connections,
        settings: await readSettings(paths),
        adapters: new Map([['claude', { ...createEchoAdapter(), detect }]]),
        readDisk,
        log: () => {},
      });
      await daemon.start();
      await daemon.wait();
      expect(daemon.exitCode).toBe(3);
      expect(detect).not.toHaveBeenCalled();
      expect(readDisk).not.toHaveBeenCalled();
      expect(server.requests).toBe(before);
      expect(existsSync(paths.daemonPid)).toBe(false);
    } finally {
      await server.close();
      removeDir(home);
      removeDir(workRootOf(home));
    }
  });
});
