import {
  existsSync,
  readFileSync,
  statSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { RotatingLog, runService } from '../src/core/service-runner.ts';
import { servicePlan, installService } from '../src/core/service.ts';
import { runnerPaths } from '../src/lib/home.ts';
import { removeDir, tempDir } from './helpers.ts';

const root = tempDir('service-runner-');
afterAll(() => removeDir(root));
let serial = 0;
const logFor = () => new RotatingLog(path.join(root, `runner-${serial++}.log`));
const command = (script: string) => [process.execPath, '-e', script];

describe('service launch policy', () => {
  it.each(['darwin', 'linux'] as const)(
    'stops on 0/auth and preserves update exit 75 on %s',
    async (platform) => {
      for (const code of [0, 3, 75]) {
        const log = logFor();
        const waits: number[] = [];
        const exit = await runService({
          command: command(
            `console.log('exit ${code}'); process.exit(${code})`,
          ),
          log,
          platform,
          wait: async (ms) => {
            waits.push(ms);
          },
        });
        expect(exit).toBe(code === 3 && platform === 'darwin' ? 0 : code);
        expect(waits).toEqual([]);
        expect(readFileSync(log.file, 'utf8')).toBe(`exit ${code}\n`);
      }
    },
  );

  it.each([
    'process.exit(1)',
    "process.kill(process.pid, 'SIGKILL')",
    'missing executable',
  ])('stops after five rapid failures: %s', async (script) => {
    const log = logFor();
    const waits: number[] = [];
    const result = await runService({
      command:
        script === 'missing executable'
          ? [path.join(root, 'missing')]
          : command(script),
      log,
      wait: async (ms) => {
        waits.push(ms);
      },
    });
    expect(result).toBe(0);
    expect(waits).toEqual([10_000, 20_000, 40_000, 80_000]);
    expect(readFileSync(log.file, 'utf8').trim().split('\n').at(-1)).toContain(
      'five rapid failures',
    );
  });

  it('resets the failure count after a stable run', async () => {
    const log = logFor();
    const waits: number[] = [];
    // First two fail fast, third runs stably; the next five fast failures exhaust the new budget.
    const durations = [1, 1, 60_000, 1, 1, 1, 1, 1];
    let tick = 0;
    let time = 0;
    const now = () => {
      if (tick++ % 2 === 1) time += durations.shift() ?? 1;
      return time;
    };
    await runService({
      command: command('process.exit(1)'),
      log,
      now,
      wait: async (ms) => {
        waits.push(ms);
      },
    });
    expect(waits).toEqual([
      10_000, 20_000, 10_000, 10_000, 20_000, 40_000, 80_000,
    ]);
  });

  it('forwards stop signals and waits for child cleanup and output', async () => {
    const log = logFor();
    const controller = new AbortController();
    const original = log.write.bind(log);
    log.write = (data) => {
      original(data);
      if (data.toString().includes('ready')) controller.abort();
    };
    const result = await runService({
      command: command(
        "process.on('SIGTERM', () => { console.log('cleaned'); process.exit(0); }); console.log('ready'); setInterval(() => {}, 1000)",
      ),
      log,
      signal: controller.signal,
    });
    expect(result).toBe(0);
    expect(readFileSync(log.file, 'utf8')).toContain('cleaned');
  });

  it('cancels a pending retry when stopped', async () => {
    const controller = new AbortController();
    let waits = 0;
    expect(
      await runService({
        command: command('process.exit(1)'),
        log: logFor(),
        signal: controller.signal,
        wait: async () => {
          waits++;
          controller.abort();
        },
      }),
    ).toBe(0);
    expect(waits).toBe(1);
  });

  it('bounds output by bytes across large chunks and restarts, retaining two backups', () => {
    const file = logFor().file;
    const log = new RotatingLog(file, 128);
    log.write(Buffer.alloc(600, 65));
    new RotatingLog(file, 128).write('last line\n');
    expect(readFileSync(file, 'utf8')).toMatch(/last line\n$/);
    for (const suffix of ['', '.1', '.2']) {
      expect(statSync(file + suffix).size).toBeLessThanOrEqual(128);
      expect(statSync(file + suffix).mode & 0o777).toBe(0o600);
    }
    expect(existsSync(file + '.3')).toBe(false);
  });

  it.each(['darwin', 'linux'] as const)(
    'replaces an old service definition and runs reload commands on %s',
    async (platform) => {
      const home = path.join(root, `install-${platform}`);
      const paths = runnerPaths(home, home);
      const plan = servicePlan({
        paths,
        command: [process.execPath],
        platform,
        home,
        env: {},
      });
      mkdirSync(path.dirname(plan.file), { recursive: true });
      writeFileSync(
        plan.file,
        platform === 'darwin'
          ? '<key>KeepAlive</key><true/>'
          : 'Restart=always',
      );
      const observed = path.join(home, 'installed.txt');
      // Execute the installation's real file replacement with a harmless stand-in for the platform manager.
      await installService(
        {
          ...plan,
          uninstall: [],
          install: [
            command(
              `const fs = require('node:fs'); fs.writeFileSync(${JSON.stringify(observed)}, fs.readFileSync(${JSON.stringify(plan.file)}));`,
            ),
          ],
        },
        paths,
      );
      expect(readFileSync(observed, 'utf8')).toBe(plan.content);
      expect(statSync(plan.file).mode & 0o777).toBe(0o600);
      if (platform === 'darwin')
        expect(plan.uninstall[0]?.slice(0, 2)).toEqual([
          'launchctl',
          'bootout',
        ]);
      else
        expect(plan.install.map((args) => args[2])).toEqual([
          'daemon-reload',
          'enable',
          'restart',
        ]);
    },
  );

  it('trims a previously unbounded log on startup', () => {
    const file = logFor().file;
    writeFileSync(file, 'old'.repeat(100));
    new RotatingLog(file, 64).write('tail');
    expect(statSync(file + '.1').size).toBe(64);
    expect(readFileSync(file, 'utf8')).toBe('tail');
  });

  it('generates restart conditions that stop authentication and normal exits, while restarting 75', () => {
    for (const platform of ['darwin', 'linux'] as const) {
      const plan = servicePlan({
        paths: runnerPaths(root, root),
        command: [process.execPath],
        platform,
        home: root,
        env: {},
      });
      if (platform === 'darwin') {
        expect(plan.content).toContain(
          '<key>SuccessfulExit</key>\n    <false/>',
        );
        expect(plan.content).toContain(
          '<string>service</string>\n    <string>run</string>',
        );
        expect(plan.content).not.toContain(root + '/logs/runner.log');
      } else {
        expect(plan.content).toContain(
          'Restart=on-failure\nRestartPreventExitStatus=3',
        );
        expect(plan.content).toContain('RestartSec=60');
        expect(plan.content).not.toContain('RestartPreventExitStatus=75');
      }
    }
  });
});
