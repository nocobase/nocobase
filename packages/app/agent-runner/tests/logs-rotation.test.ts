import { spawn } from 'node:child_process';
import { afterAll, expect, it } from 'vitest';
import { RotatingLog } from '../src/core/service-runner.ts';
import { runnerPaths } from '../src/lib/home.ts';
import { waitFor } from './fake-server.ts';
import { BIN, cliEnv, removeDir, tempDir } from './helpers.ts';

const home = tempDir('runner-log-follow-');
afterAll(() => removeDir(home));

it('follows a rotated file even when the new file is larger than the old offset', async () => {
  const writer = new RotatingLog(runnerPaths(home).daemonLog, 128);
  writer.write('ready\n');
  const child = spawn(process.execPath, [BIN, 'logs', '--follow'], {
    env: cliEnv(home),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const closed = new Promise<void>((resolve) =>
    child.on('close', () => resolve()),
  );
  let output = '';
  child.stdout.on('data', (data: Buffer) => {
    output += data.toString();
  });
  try {
    await waitFor(() => output.includes('ready'));
    writer.write('x'.repeat(128) + '\nnew file followed\n');
    await waitFor(() => output.includes('new file followed'));
    expect(output).toContain('new file followed');
  } finally {
    child.kill('SIGINT');
    await closed;
  }
});
