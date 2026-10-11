import { spawn } from 'node:child_process';
import path from 'node:path';

/** The `nb-studio` entry the tests spawn: Studio's CLI as `nocobase cli link` makes it, from the workspace sources. */
export const STUDIO_CLI_BIN: string = path.resolve(
  import.meta.dirname,
  'nb-studio-cli.mjs',
);

export interface StudioCliResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

/**
 * This process's environment without what a CI run sets (`GITHUB_*`, GitLab's `CI_*`): the CLI reads the repository and
 * the commit from it, so a test run in CI would otherwise send the test runner's own.
 */
function withoutCi(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  return Object.fromEntries(
    Object.entries(env).filter(
      ([name]) => !name.startsWith('GITHUB_') && !name.startsWith('CI_'),
    ),
  );
}

/** Runs `nb-studio <args>` in `cwd` with `env` added to this process's environment, less CI's. */
export function runStudioCli(
  args: readonly string[],
  options: { cwd: string; env?: NodeJS.ProcessEnv },
): Promise<StudioCliResult> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [STUDIO_CLI_BIN, ...args], {
      cwd: options.cwd,
      env: { ...withoutCi(process.env), ...options.env },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()));
    child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}
