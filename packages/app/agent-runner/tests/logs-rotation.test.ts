import { spawn } from 'node:child_process';
import path from 'node:path';
import { afterAll, expect, it } from 'vitest';
import { RotatingLog } from '../src/core/service-runner.ts';
import { runnerPaths } from '../src/lib/home.ts';
import { waitFor } from './fake-server.ts';
import { BIN, cliEnv, removeDir, tempDir } from './helpers.ts';

const home = tempDir('runner-log-follow-');
afterAll(() => removeDir(home));

it.each(['rotation', 'append'] as const)(
  'follows a log %s between initial output and watcher initialization',
  async (change) => {
    const writer = new RotatingLog(
      runnerPaths(path.join(home, change)).daemonLog,
      128,
    );
    writer.write('ready\n');
    const child = spawn(process.execPath, [BIN, 'logs', '--follow'], {
      env: cliEnv(path.join(home, change), {
        NODE_OPTIONS: [
          process.env.NODE_OPTIONS,
          `--import=${path.join(import.meta.dirname, 'fixtures/log-follow-gate.mjs')}`,
        ]
          .filter(Boolean)
          .join(' '),
      }),
      stdio: ['ignore', 'pipe', 'pipe', 'pipe'],
    });
    const closed = new Promise<void>((resolve) =>
      child.on('close', () => resolve()),
    );
    let output = '';
    let stderr = '';
    child.stdout.on('data', (data: Buffer) => {
      output += data.toString();
    });
    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });
    let released = false;
    try {
      await waitFor(
        () => output.includes('ready'),
        undefined,
        'initial log output',
      );
      writer.write(
        (change === 'rotation' ? 'x'.repeat(128) : '') +
          '\nnew file followed\n',
      );
      child.stdio[3]?.write('!');
      released = true;
      await waitFor(
        () => output.includes('new file followed'),
        undefined,
        'log update during watcher initialization',
      );
      // Also prove the watcher keeps following after the startup catch-up.
      writer.write('later update\n');
      await waitFor(
        () => output.includes('later update'),
        undefined,
        'later log update',
      );
      expect(output.match(/new file followed/g)).toHaveLength(1);
      expect(output.match(/later update/g)).toHaveLength(1);
      expect(stderr).toBe('');
    } finally {
      child.kill(released ? 'SIGINT' : 'SIGKILL');
      await closed;
    }
  },
);
