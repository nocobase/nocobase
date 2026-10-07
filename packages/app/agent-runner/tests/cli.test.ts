// The runner's own commands: registering with one or more applications, status, and the service definitions.
import { statSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { runnerPaths } from '../src/lib/home.ts';
import { servicePlan } from '../src/core/service.ts';
import { FakeServer } from './fake-server.ts';
import {
  cli,
  cliEnv,
  registerRunner,
  removeDir,
  tempDir,
  workRootOf,
  writeFakeCli,
} from './helpers.ts';

describe('nocobase-runner cli', () => {
  const first = new FakeServer();
  const second = new FakeServer({ app: { id: 'crm', name: 'CRM' } });
  const anonymous = new FakeServer({ app: undefined });
  const home = tempDir('nocobase-runner-cli-home-');
  const env = cliEnv(home);

  beforeAll(async () => {
    await first.listen();
    await second.listen();
    await anonymous.listen();
  });
  afterAll(async () => {
    await first.close();
    await second.close();
    await anonymous.close();
    removeDir(home);
    removeDir(workRootOf(home));
  });

  it('registers with several applications, one key each, and refuses a second registration', async () => {
    const fake = writeFakeCli(home);
    await registerRunner(first.url, env, [
      '--slots',
      '2',
      '--cli',
      `appcli=${fake}`,
    ]);
    // Without --slots the token's number applies, raising the runner's shared slots but never lowering them.
    second.tokenSlots = 3;
    await registerRunner(second.url, env);
    await registerRunner(anonymous.url, env);
    expect(first.runners.get('runner-1')?.register.slots).toBe(2);
    expect(second.runners.get('runner-1')?.register).not.toHaveProperty(
      'slots',
    );
    const again = await cli(
      ['register', '--server', first.url, '--token', 'reg-token'],
      env,
    );
    expect(again.code).toBe(6);
    const badCli = await cli(
      [
        'register',
        '--server',
        first.url,
        '--token',
        'reg-token',
        '--force',
        '--cli',
        'appcli',
      ],
      env,
    );
    expect(badCli.code).toBe(5);

    const status = await cli(['status', '--json'], env);
    const parsed = (
      JSON.parse(status.stdout) as {
        result: {
          apps: {
            key: string;
            server: string;
            cli: Record<string, string>;
          }[];
        };
      }
    ).result;
    expect(parsed).toMatchObject({
      registered: true,
      name: 'test-runner',
      slots: 3,
      agentHome: 'isolated',
      running: false,
    });
    expect(parsed.apps.map((app) => app.key).sort()).toEqual(
      ['crm', 'test-app', `127.0.0.1_${new URL(anonymous.url).port}`].sort(),
    );
    expect(parsed.apps.find((app) => app.key === 'test-app')?.cli).toEqual({
      appcli: fake,
    });
    for (const key of ['test-app', 'crm'])
      expect(
        statSync(path.join(home, 'credentials', `${key}.json`)).mode & 0o777,
      ).toBe(0o600);

    const removed = await cli(['unregister', '--server', second.url], env);
    expect(removed.code).toBe(0);
    const after = (
      JSON.parse((await cli(['status', '--json'], env)).stdout) as {
        result: { apps: unknown[] };
      }
    ).result;
    expect(after.apps).toHaveLength(2);
  });

  it('prints the launchd service without installing it', async () => {
    const dry = await cli(['service', 'install', '--dry-run'], env);
    expect(dry.code).toBe(0);
    if (process.platform === 'darwin') {
      expect(dry.stdout).toContain('<string>com.nocobase.runner</string>');
      expect(dry.stdout).toContain('<string>--foreground</string>');
      expect(dry.stdout).toMatch(/\$ launchctl bootstrap gui\/\d+ /);
    }
  });

  it('writes a systemd user unit for Linux', () => {
    const plan = servicePlan({
      paths: runnerPaths(
        '/home/u/.nocobase-runner',
        '/home/u/.nocobase-runner-work',
      ),
      command: ['/usr/bin/node', '/opt/acme/bin/run.js', 'runner'],
      platform: 'linux',
      home: '/home/u',
      env: { PATH: '/usr/bin' },
    });
    expect(plan.file).toBe(
      '/home/u/.config/systemd/user/nocobase-runner.service',
    );
    expect(plan.content).toContain(
      'ExecStart=/usr/bin/node /opt/acme/bin/run.js runner start --foreground',
    );
    expect(plan.content).toContain(
      'Environment=NOCOBASE_RUNNER_HOME=/home/u/.nocobase-runner',
    );
    expect(plan.install.slice(1)).toEqual([
      ['systemctl', '--user', 'enable', 'nocobase-runner.service'],
      ['systemctl', '--user', 'restart', 'nocobase-runner.service'],
    ]);
    expect(plan.content).toContain('Environment=NOCOBASE_RUNNER_SERVICE=1');
  });
});
