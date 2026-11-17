import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs';
import path from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { RunnerJournal, runService } from '../src/core/service-runner.ts';
import { servicePlan, installService } from '../src/core/service.ts';
import { launcherPidPath } from '../src/core/launcher.ts';
import { runnerPaths } from '../src/lib/home.ts';
import { removeDir, tempDir, readDaemonLog } from './helpers.ts';

const root = tempDir('service-runner-');
afterAll(() => removeDir(root));
let serial = 0;
const logFor = () => {
  const paths = runnerPaths(path.join(root, `runner-${serial++}`));
  return Object.assign(new RunnerJournal(paths.logsDir), {
    directory: paths.logsDir,
    file: path.join(
      paths.logsDir,
      `runner.${new Date().toISOString().slice(0, 10)}.000000.log`,
    ),
  });
};
const command = (script: string) => [process.execPath, '-e', script];

describe('service launch policy', () => {
  it('主进程 JSON 每行只解析和序列化一次，敏感值只在持久化边界处理', () => {
    const log = logFor();
    const input =
      JSON.stringify({
        time: new Date().toISOString(),
        level: 30,
        msg: 'api_key=fixture-sensitive-value',
        requestId: 'request-fixture',
      }) + '\n';
    const parse = vi.spyOn(JSON, 'parse');
    const stringify = vi.spyOn(JSON, 'stringify');
    try {
      log.write(input);
      log.flush();
      expect(parse).toHaveBeenCalledTimes(1);
      expect(stringify).toHaveBeenCalledTimes(1);
    } finally {
      parse.mockRestore();
      stringify.mockRestore();
    }
    const saved = readDaemonLog(log.directory);
    expect(saved).not.toContain('fixture-sensitive-value');
    expect(saved).toContain('request-fixture');
  });
  it.each(['0', '1'])(
    'preserves clean, authentication and update exits (service=%s)',
    async (service) => {
      for (const code of [0, 3, 75]) {
        const log = logFor();
        const waits: number[] = [];
        const paths = runnerPaths(`${log.directory}.home`, root);
        const exit = await runService({
          paths,
          command: command(
            `console.log('exit ${code}'); process.exit(${code})`,
          ),
          log,
          env: { ...process.env, NOCOBASE_RUNNER_SERVICE: service },
          wait: async (ms) => {
            waits.push(ms);
          },
        });
        expect(exit).toBe(code);
        expect(waits).toEqual([]);
        expect(existsSync(launcherPidPath(paths))).toBe(false);
        expect(JSON.parse(readDaemonLog(log.directory).trim()).msg).toBe(
          `exit ${code}`,
        );
      }
    },
  );

  it.each([
    'process.exit(1)',
    "process.kill(process.pid, 'SIGTERM')",
    'missing executable',
  ])(
    'delegates service failures immediately to the manager: %s',
    async (script) => {
      const waits: number[] = [];
      const result = await runService({
        command:
          script === 'missing executable'
            ? [path.join(root, 'missing')]
            : command(script),
        env: { ...process.env, NOCOBASE_RUNNER_SERVICE: '1' },
        log: logFor(),
        wait: async (ms) => {
          waits.push(ms);
        },
      });
      expect(result).toBe(1);
      expect(waits).toEqual([]);
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
    expect(readDaemonLog(log.directory).trim().split('\n').at(-1)).toContain(
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
    expect(readDaemonLog(log.directory)).toContain('cleaned');
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

  it('rolls UTC journal segments and wraps oversized output without splitting records', () => {
    const log = logFor();
    const directory = log.directory;
    const writer = new RunnerJournal(directory);
    for (let index = 0; index < 6000; index++)
      writer.write('bounded line' + 'x'.repeat(1000) + '\n');
    writer.write('x'.repeat(100000) + '\nlast line\n');
    writer.flush();
    const files = readdirSync(directory).filter((name) =>
      name.endsWith('.log'),
    );
    expect(files.length).toBeGreaterThan(1);
    const records = files.flatMap((name) => {
      expect(statSync(path.join(directory, name)).size).toBeLessThanOrEqual(
        5 * 1024 ** 2,
      );
      return readFileSync(path.join(directory, name), 'utf8')
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line));
    });
    expect(records.some((entry) => entry.truncated)).toBe(true);
    expect(records.at(-1).msg).toBe('last line');
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

  it('resumes a new bounded segment after a previously oversized segment', () => {
    const log = logFor();
    mkdirSync(path.dirname(log.file), { recursive: true });
    writeFileSync(log.file, 'old'.repeat(2 * 1024 ** 2));
    new RunnerJournal(path.dirname(log.file)).write('tail\n');
    const newest = readdirSync(path.dirname(log.file)).sort().at(-1)!;
    expect(
      readFileSync(path.join(path.dirname(log.file), newest), 'utf8'),
    ).toContain('tail');
    expect(
      statSync(path.join(path.dirname(log.file), newest)).size,
    ).toBeLessThanOrEqual(1024);
  });

  it('restarts every service exit after 60 seconds without a failure budget', () => {
    for (const platform of ['darwin', 'linux'] as const) {
      const plan = servicePlan({
        paths: runnerPaths(root, root),
        command: [process.execPath],
        platform,
        home: root,
        env: {},
      });
      if (platform === 'darwin') {
        expect(plan.content).toContain('<key>KeepAlive</key>\n  <true/>');
        expect(plan.content).toContain(
          '<string>service</string>\n    <string>run</string>',
        );
        expect(plan.content).not.toContain(root + '/logs/runner.log');
      } else {
        expect(plan.content).toContain('Restart=always');
        expect(plan.content).toContain('RestartSec=60');
        expect(plan.content).not.toContain('RestartPreventExitStatus');
        expect(plan.content).toContain('StartLimitIntervalSec=0');
      }
    }
  });
});
