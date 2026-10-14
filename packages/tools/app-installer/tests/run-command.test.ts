import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { installInterruptHandlers } from '../src/lib/interrupt.ts';
import { runCommand } from '../src/lib/run-command.ts';
import { tempDir } from './harness.ts';

function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function processSnapshot(pid: number) {
  try {
    // Select only the test grandchild and omit command lines and environment data.
    const fields = execFileSync(
      'ps',
      ['-p', String(pid), '-o', 'stat=,ppid=,pgid='],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    ).trim();
    const [state, ppid, pgid] = fields.split(/\s+/);
    return { pid, alive: alive(pid), state, ppid, pgid };
  } catch {
    return { pid, alive: alive(pid), state: 'unavailable' };
  }
}

async function waitFor(file: string): Promise<number> {
  for (let attempt = 0; attempt < 50 && !existsSync(file); attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return Number.parseInt(readFileSync(file, 'utf8'), 10);
}

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
  it('stops the whole process group on a timeout, not only the direct child', async () => {
    const pidFile = path.join(temp.dir, 'grandchild.pid');
    const pending = runCommand(
      'sh',
      ['-c', `sleep 30 & echo $! > ${pidFile}; wait`],
      {
        timeoutMs: 300,
      },
    );
    await expect(pending).rejects.toThrow(/timed out/);
    const grandchild = await waitFor(pidFile);
    const aliveAtClose = alive(grandchild);
    if (aliveAtClose) {
      const atClose = processSnapshot(grandchild);
      // This recheck diagnoses a failure; the assertion keeps the original observation.
      await new Promise((resolve) => setTimeout(resolve, 50));
      console.error('Timeout grandchild diagnostic', {
        atClose,
        after50ms: processSnapshot(grandchild),
      });
    }
    expect(aliveAtClose).toBe(false);
  });

  it('turns an interrupt into an INTERRUPTED failure of the running step only', async () => {
    const remove = installInterruptHandlers({
      write: () => true,
    } as unknown as NodeJS.WritableStream);
    try {
      const pending = runCommand('sleep', ['30']);
      await new Promise((resolve) => setTimeout(resolve, 100));
      process.emit('SIGINT', 'SIGINT');
      await expect(pending).rejects.toMatchObject({ code: 'INTERRUPTED' });
      // The interrupt was consumed by that step: recovery steps after it run normally.
      await expect(runCommand('true', [])).resolves.toMatchObject({
        stdout: '',
      });
    } finally {
      remove();
    }
  });
});
