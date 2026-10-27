import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runCommand } from '../src/lib/run-command.ts';
import { tempDir } from './harness.ts';

let temp: ReturnType<typeof tempDir>;

beforeEach(() => {
  temp = tempDir('app-installer-run-');
});

afterEach(() => {
  temp.remove();
});

describe('runCommand', () => {
  it('sends input over stdin without putting it in command arguments', async () => {
    const result = await runCommand(
      process.execPath,
      ['-e', 'process.stdin.pipe(process.stdout)'],
      { input: 'private-input' },
    );
    expect(result.stdout).toBe('private-input');
  });
  it
    .skipIf(process.platform !== 'linux')
    .each([
      'ordinary-timeout',
      'ordinary-interrupt',
      'resistant-closed-timeout',
      'resistant-inherited-timeout',
      'early-exit-inherited-timeout',
      'resistant-closed-interrupt',
    ])(
    'stops runnable descendants and writes before returning: %s',
    async (mode) => {
      const { stdout, stderr } = await promisify(execFile)(
        'python3',
        [
          new URL('./fixtures/run-command-supervisor.py', import.meta.url)
            .pathname,
          process.execPath,
          new URL('./fixtures/run-command-probe.mjs', import.meta.url).pathname,
          mode,
          temp.dir,
        ],
        { timeout: 25_000 },
      );
      const result = JSON.parse(stdout);
      console.info('Process stop evidence', result, stderr.trim());
      expect(result.outcome.resolved).toBeUndefined();
      if (mode.includes('interrupt'))
        expect(result.outcome.code).toBe('INTERRUPTED');
      else expect(result.outcome.message).toMatch(/timed out/);
      // The subreaper deliberately retains zombies: kill(pid, 0) is not a liveness assertion.
      expect(result.atReturn.state).toBe('Z');
      expect(result.after.state).toBe('Z');
      expect(result.bytesAfter).toBe(result.bytesAtReturn);
      expect(result.recovery).toBe('recovered');
      if (mode.includes('early-exit')) expect(result.outcome.exitCode).toBe(7);
      expect(stderr).toMatch(/Reaped 1 adopted probe children/);
      if (mode.includes('resistant'))
        expect(result.elapsedMs).toBeGreaterThanOrEqual(10_000);
      else expect(result.elapsedMs).toBeLessThan(5000);
    },
    25_000,
  );
});
