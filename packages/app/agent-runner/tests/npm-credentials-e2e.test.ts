// The private npm registry's token end to end: the real daemon and worker, the echo adapter running the agent's
// `pnpm install` through the run's wrapper, a machine whose `~/.npmrc` names a mirror, and a private registry that,
// like NocoBase's, answers 404 without the token.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { FakeServer, waitFor } from './fake-server.ts';
import {
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
import { Registry } from './npm-registry-server.ts';

const TOKEN = 'synthetic-private-registry-token-0002';

describe('the private npm registry token on demand', () => {
  let server: FakeServer;
  let home: string;
  let scratch: string;
  let mirror: Registry;
  let privateRegistry: Registry;
  let env: NodeJS.ProcessEnv;
  const daemons: Daemon[] = [];

  beforeEach(async () => {
    server = new FakeServer();
    await server.listen();
    home = tempDir('nocobase-runner-home-');
    scratch = tempDir('nocobase-runner-scratch-');
    mirror = new Registry(scratch, ['left-pad-fx']);
    privateRegistry = new Registry(scratch, ['@nocobase/fx-private'], TOKEN);
    await mirror.start();
    await privateRegistry.start();
    const machineHome = path.join(scratch, 'machine');
    mkdirSync(machineHome, { recursive: true });
    writeFileSync(
      path.join(machineHome, '.npmrc'),
      `registry=${mirror.url}\n@nocobase:registry=${privateRegistry.url}\n`,
    );
    env = cliEnv(home, {
      HOME: machineHome,
      NOCOBASE_RUNNER_NPM_REGISTRY: privateRegistry.url,
    });
    await registerRunner(server.url, env, [
      '--cli',
      `appcli=${writeFakeCli(scratch)}`,
    ]);
  });

  afterEach(async () => {
    for (const daemon of daemons.splice(0)) await stopDaemon(daemon);
    await server.close();
    await mirror.stop();
    await privateRegistry.stop();
    removeDir(home);
    removeDir(workRootOf(home));
    removeDir(scratch);
  });

  it('announces the feature', () => {
    const runner = [...server.runners.values()][0];
    expect(runner?.register.features).toContain('npmCredentials');
  });

  it('installs a private package after asking once, redacts the token and removes the run’s npm files', async () => {
    server.npmToken = TOKEN;
    const manifest = JSON.stringify({
      name: 'fx-app',
      version: '0.0.0',
      dependencies: { '@nocobase/fx-private': '1.0.0', 'left-pad-fx': '1.0.0' },
    });
    const run = server.enqueue({
      prompt: {
        system: 'System rules.',
        session: 'fresh',
        turn: [
          `write package.json ${manifest}`,
          'bash pnpm install 2>&1',
          'bash ls node_modules/@nocobase',
          'bash echo "$NOCOBASE_RUNNER_NPM_DIR"',
          `bash echo leaked ${TOKEN}`,
          'say done',
        ].join('\n'),
      },
    });
    daemons.push(startDaemon(env));
    await waitFor(
      () => run.status === 'completed' || run.status === 'failed',
      60_000,
      'the run to end',
    );
    expect(run.fail).toBeUndefined();
    expect(server.npmCredentialRequests).toEqual([
      {
        runId: run.payload.run.id,
        attempt: 1,
        reason: 'notFound',
        package: '@nocobase/fx-private',
      },
    ]);
    // The mirror served the ordinary package; the private registry was asked with the token only.
    expect(mirror.seen.map((seen) => seen.url)).toContain('/left-pad-fx');
    expect(
      privateRegistry.seen.every((seen) => seen.auth === `Bearer ${TOKEN}`),
    ).toBe(true);
    const events = server.events(run.payload.run.id);
    const outputs = events
      .filter((event) => event.type === 'toolResult')
      .map((event) => String(event.output ?? ''));
    expect(outputs.join('\n')).toContain(
      'retrying once with the NocoBase private registry',
    );
    expect(outputs.some((output) => output.includes('fx-private'))).toBe(true);
    expect(JSON.stringify(events)).not.toContain(TOKEN);
    expect(outputs.join('\n')).toContain('leaked [REDACTED]');
    const npmDir = outputs
      .map((output) => output.trim())
      .find((output) => output.endsWith(`${path.sep}npm`));
    expect(npmDir).toBeDefined();
    // The worker removes it as it finishes, after reporting.
    await waitFor(
      () => !existsSync(npmDir ?? ''),
      10_000,
      'the run’s npm directory to go',
    );
  });

  it('asks for nothing when the project needs no private package', async () => {
    server.npmToken = TOKEN;
    const manifest = JSON.stringify({
      name: 'fx-app',
      version: '0.0.0',
      dependencies: { 'left-pad-fx': '1.0.0' },
    });
    const run = server.enqueue({
      prompt: {
        system: 'System rules.',
        session: 'fresh',
        turn: [
          `write package.json ${manifest}`,
          'bash pnpm install 2>&1',
          'say done',
        ].join('\n'),
      },
    });
    daemons.push(startDaemon(env));
    await waitFor(
      () => run.status === 'completed' || run.status === 'failed',
      60_000,
      'the run to end',
    );
    expect(run.fail).toBeUndefined();
    expect(server.npmCredentialRequests).toEqual([]);
    expect(privateRegistry.seen).toEqual([]);
  });
});
