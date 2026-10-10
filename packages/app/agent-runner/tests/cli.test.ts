// The runner's own commands: registering with one or more applications, status, and the service definitions.
import { readdirSync, readFileSync, statSync } from 'node:fs';
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
    expect(plan.captured).toEqual([]);
  });

  it("writes the installing shell's proxy, CA and --pass-env variables into the service", () => {
    const env = {
      PATH: '/usr/bin',
      HTTPS_PROXY: 'http://user:p%40ss@proxy:3128',
      no_proxy: 'localhost',
      NODE_EXTRA_CA_CERTS: '/etc/ca.pem',
      PI_KEY: 'sk "quoted"',
      UNRELATED: 'x',
    };
    const paths = runnerPaths(
      '/home/u/.nocobase-runner',
      '/home/u/.nocobase-runner-work',
    );
    const linux = servicePlan({
      paths,
      command: ['/usr/bin/node', '/opt/acme/bin/run.js'],
      platform: 'linux',
      home: '/home/u',
      env,
      passEnv: ['PI_KEY', 'NOT_SET'],
    });
    expect(linux.captured).toEqual([
      'HTTPS_PROXY',
      'no_proxy',
      'NODE_EXTRA_CA_CERTS',
      'PI_KEY',
    ]);
    // systemd expands `%` specifiers: a percent-encoded password is written doubled.
    expect(linux.content).toContain(
      'Environment=HTTPS_PROXY=http://user:p%%40ss@proxy:3128',
    );
    expect(linux.content).toContain('Environment=no_proxy=localhost');
    expect(linux.content).toContain('Environment="PI_KEY=sk \\"quoted\\""');
    expect(linux.content).not.toContain('UNRELATED');
    expect(linux.content).not.toContain('NOT_SET');
    const mac = servicePlan({
      paths,
      command: ['/usr/bin/node', '/opt/acme/bin/run.js'],
      platform: 'darwin',
      home: '/Users/u',
      uid: 501,
      env,
      passEnv: ['PI_KEY'],
    });
    expect(mac.content).toContain(
      '<key>HTTPS_PROXY</key>\n    <string>http://user:p%40ss@proxy:3128</string>',
    );
    expect(mac.content).toContain(
      '<key>PI_KEY</key>\n    <string>sk "quoted"</string>',
    );
  });

  it('keeps local variables with env set, lists their names only, and forgets them with env unset', async () => {
    await cli(['env', 'set', 'PI_KEY', 'sk-local-value'], env);
    const piped = await cli(['env', 'set', 'OTHER_KEY'], env, {
      input: 'from-stdin\n',
    });
    expect(piped.code).toBe(0);
    const listed = await cli(['env', 'list', '--json'], env);
    expect(listed.stdout).not.toContain('sk-local-value');
    const entries = (
      JSON.parse(listed.stdout) as {
        result: { name: string; source: string }[];
      }
    ).result;
    expect(entries.map((entry) => entry.name)).toEqual(['OTHER_KEY', 'PI_KEY']);
    for (const file of readdirSync(path.join(home, 'apps'))) {
      const stored = path.join(home, 'apps', file);
      expect(
        (
          JSON.parse(readFileSync(stored, 'utf8')) as {
            variables: Record<string, string>;
          }
        ).variables,
      ).toMatchObject({ PI_KEY: 'sk-local-value', OTHER_KEY: 'from-stdin' });
      expect(statSync(stored).mode & 0o777).toBe(0o600);
    }
    expect((await cli(['env', 'set', '1BAD', 'x'], env)).code).toBe(5);
    expect((await cli(['env', 'unset', 'PI_KEY'], env)).code).toBe(0);
    expect((await cli(['env', 'unset', 'PI_KEY'], env)).code).toBe(4);
    await cli(['env', 'unset', 'OTHER_KEY'], env);
  });
});
