import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// A packaged CLI branded as an application would brand it, run from the sources: the entry `nocobase cli build` and
// `nocobase cli link` generate, with the `nocobase.cli` of its own package.json.
export const PACKAGE_ROOT = path.resolve(
  import.meta.dirname,
  '../fixtures/packaged-cli',
);
export const BIN = path.join(PACKAGE_ROOT, 'bin', 'run.js');

export function tempDir(prefix = 'packaged-cli-'): string {
  // realpath: macOS's /var is a link to /private/var.
  return execFileSync(
    'realpath',
    [mkdtempSync(path.join(os.tmpdir(), prefix))],
    { encoding: 'utf8' },
  ).trim();
}

export function removeDir(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

export function cliEnv(
  home: string,
  extra: Record<string, string> = {},
): NodeJS.ProcessEnv {
  // The keychain stays off: a test never writes to the real one (tests/secrets.test.ts covers it with fakes).
  return {
    ...process.env,
    ACME_HOME: home,
    ACME_KEYCHAIN: 'off',
    ...extra,
  };
}

export interface CliResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

export function cli(
  args: string[],
  env: NodeJS.ProcessEnv,
  options: { cwd?: string; input?: string } = {},
): Promise<CliResult> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [BIN, ...args], {
      env,
      cwd: options.cwd ?? PACKAGE_ROOT,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()));
    child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
    child.stdin.end(options.input ?? '');
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}
