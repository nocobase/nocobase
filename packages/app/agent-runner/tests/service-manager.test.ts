import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  migrateService,
  restartService,
  servicePlan,
  stopService,
} from '../src/core/service.ts';
import { readSettings, writeSettings } from '../src/lib/config.ts';
import { runnerPaths } from '../src/lib/home.ts';
import { cli, cliEnv, removeDir, tempDir } from './helpers.ts';

const root = tempDir('service-manager-');
afterAll(() => removeDir(root));
let home: string;
let calls: string;
let bin: string;
const recorded = (): string[][] =>
  existsSync(calls)
    ? readFileSync(calls, 'utf8')
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line) as string[])
    : [];

beforeEach(() => {
  home = tempDir('service-manager-case-');
  bin = path.join(home, 'bin');
  calls = path.join(home, 'calls.jsonl');
  mkdirSync(bin);
  for (const name of ['systemctl', 'launchctl']) {
    const file = path.join(bin, name);
    writeFileSync(
      file,
      `#!${process.execPath}\nconst fs = require('node:fs'); fs.appendFileSync(${JSON.stringify(calls)}, JSON.stringify(process.argv.slice(2)) + '\\n'); process.exit(Number((process.argv[2] === 'bootout' ? process.env.TEST_BOOTOUT_EXIT : undefined) || process.env.TEST_MANAGER_EXIT || 0));\n`,
    );
    chmodSync(file, 0o755);
  }
  vi.stubEnv('PATH', `${bin}${path.delimiter}${process.env.PATH}`);
});
afterEach(() => {
  vi.unstubAllEnvs();
  removeDir(home);
});

describe('installed service migration', () => {
  it.each(['linux', 'darwin'] as const)(
    'migrates an old %s definition once without changing its environment or command',
    async (platform) => {
      const label = 'com.example.migrate';
      const plan = servicePlan({
        paths: runnerPaths(home, `${home}-work`),
        command: ['/old/current/bin/nocobase-runner'],
        label,
        platform,
        home,
        env: { PATH: '/saved/bin', HTTPS_PROXY: 'http://example.invalid:3128' },
      });
      const old =
        platform === 'linux'
          ? plan.content
              .replace(
                'Restart=always',
                'Restart=on-failure\nRestartPreventExitStatus=3',
              )
              .replace(
                'StartLimitIntervalSec=0',
                'StartLimitIntervalSec=300\nStartLimitBurst=5',
              )
          : plan.content.replace(
              '<key>KeepAlive</key>\n  <true/>',
              '<key>KeepAlive</key>\n  <dict>\n    <key>SuccessfulExit</key>\n    <false/>\n  </dict>',
            );
      mkdirSync(path.dirname(plan.file), { recursive: true });
      writeFileSync(plan.file, old);
      const options = {
        platform,
        home,
        relaunch: ['/old/current/bin/nocobase-runner'],
      };
      expect(await migrateService(label, options)).toBe(true);
      expect(readFileSync(plan.file, 'utf8')).toBe(plan.content);
      expect(statSync(plan.file).mode & 0o777).toBe(0o600);
      expect(await migrateService(label, options)).toBe(false);
      expect(recorded()).toEqual(
        platform === 'linux'
          ? [['--user', 'daemon-reload']]
          : [
              [
                'submit',
                '-l',
                `${label}.reload`,
                '--',
                '/old/current/bin/nocobase-runner',
                'service',
                'restart',
                '--label',
                label,
              ],
            ],
      );
    },
  );

  it.each(['linux', 'darwin'] as const)(
    'keeps migration retryable if the %s manager rejects its reload',
    async (platform) => {
      const plan = servicePlan({
        paths: runnerPaths(home),
        command: ['/runner'],
        platform,
        home,
        env: {},
      });
      const old =
        platform === 'linux'
          ? plan.content.replace('Restart=always', 'Restart=on-failure')
          : plan.content.replace(
              '<key>KeepAlive</key>\n  <true/>',
              '<key>KeepAlive</key><false/>',
            );
      mkdirSync(path.dirname(plan.file), { recursive: true });
      writeFileSync(plan.file, old);
      vi.stubEnv('TEST_MANAGER_EXIT', '1');
      await expect(
        migrateService(plan.label, { platform, home, relaunch: ['/runner'] }),
      ).rejects.toThrow();
      expect(readFileSync(plan.file, 'utf8')).toBe(old);
      vi.stubEnv('TEST_MANAGER_EXIT', '0');
      expect(
        await migrateService(plan.label, {
          platform,
          home,
          relaunch: ['/runner'],
        }),
      ).toBe(true);
    },
  );

  it('does not install a service when there is no existing definition', async () => {
    expect(
      await migrateService('com.example.absent', { home, platform: 'linux' }),
    ).toBe(false);
    expect(recorded()).toEqual([]);
  });
});

describe('service stop command', () => {
  it.each([3, 113])(
    'can stop and restart a launchd job already unloaded (exit %s)',
    async (code) => {
      vi.stubEnv('TEST_BOOTOUT_EXIT', String(code));
      await stopService('com.example.unloaded', 'darwin');
      await restartService('com.example.unloaded', 'darwin');
      expect(recorded()).toEqual([
        ['bootout', `gui/${process.getuid?.() ?? 501}/com.example.unloaded`],
        ['bootout', `gui/${process.getuid?.() ?? 501}/com.example.unloaded`],
        [
          'bootstrap',
          `gui/${process.getuid?.() ?? 501}`,
          path.join(
            os.homedir(),
            'Library/LaunchAgents/com.example.unloaded.plist',
          ),
        ],
      ]);
    },
  );

  it('surfaces launchd permission failures without attempting a replacement', async () => {
    vi.stubEnv('TEST_MANAGER_EXIT', '1');
    await expect(
      restartService('com.example.denied', 'darwin'),
    ).rejects.toThrow();
    expect(recorded()).toEqual([
      ['bootout', `gui/${process.getuid?.() ?? 501}/com.example.denied`],
    ]);
  });

  it.each([0, 1])(
    'uses the manager even without a daemon and reports manager exit %s',
    async (managerExit) => {
      const paths = runnerPaths(home);
      await writeSettings(
        { ...(await readSettings(paths)), serviceLabel: 'com.example.stop' },
        paths,
      );
      const result = await cli(
        ['stop', '--json'],
        cliEnv(home, { TEST_MANAGER_EXIT: String(managerExit) }),
      );
      if (process.platform === 'linux') {
        expect(result.code).toBe(managerExit);
        expect(recorded()).toEqual([
          ['--user', 'stop', 'com.example.stop.service'],
        ]);
      } else {
        expect(result.code).toBe(managerExit);
        expect(recorded()[0]).toEqual([
          'bootout',
          `gui/${process.getuid?.() ?? 501}/com.example.stop`,
        ]);
      }
      if (result.code === 0)
        expect(JSON.parse(result.stdout).result.stopped).toBe(true);
    },
  );
});
