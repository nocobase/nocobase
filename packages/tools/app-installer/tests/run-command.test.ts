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
    expect(alive(grandchild)).toBe(false);
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
