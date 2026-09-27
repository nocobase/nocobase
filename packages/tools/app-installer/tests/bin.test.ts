import { spawn } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import packageMetadata from '../package.json' with { type: 'json' };

const bin = path.join(import.meta.dirname, '..', 'bin', 'run.js');

/** Runs the published entry point with stdout on a pipe, the way an agent or `| jq` reads it. */
function runBin(
  args: string[],
): Promise<{ code: number | null; stdout: string }> {
  const child = spawn(process.execPath, [bin, ...args], {
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  let stdout = '';
  child.stdout.on('data', (chunk: Buffer) => {
    stdout += chunk.toString();
  });
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code) => resolve({ code, stdout }));
  });
}

describe('bin/run.js', () => {
  it('prints one whole JSON document on a pipe before it exits', async () => {
    const { code, stdout } = await runBin(['--version', '--json']);
    expect(code).toBe(0);
    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      result: { version: packageMetadata.version },
    });
  });

  it('passes on the exit code of a failed command', async () => {
    const { code, stdout } = await runBin(['frobnicate', '--json']);
    expect(code).toBe(2);
    expect(JSON.parse(stdout)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_USAGE' },
    });
  });
});
