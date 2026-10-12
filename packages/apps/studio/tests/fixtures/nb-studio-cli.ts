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
 * Remove ambient CI repository information and Studio identity. Tests supply their own server, home and credentials
 * explicitly, so child processes cannot use the runner's identity or report its repository and commit.
 */
function withoutCi(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  return Object.fromEntries(
    Object.entries(env).filter(
      ([name]) =>
        !name.startsWith('GITHUB_') &&
        !name.startsWith('CI_') &&
        !name.startsWith('NB_STUDIO_') &&
        name !== 'AGENT_RUN_CREDENTIALS',
    ),
  );
}

/** Runs `nb-studio <args>` in `cwd` with `env` added to this process's environment, without ambient CI or Studio identity. */
export function runStudioCli(
  args: readonly string[],
  options: { cwd: string; env?: NodeJS.ProcessEnv },
): Promise<StudioCliResult> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [STUDIO_CLI_BIN, ...args], {
      cwd: options.cwd,
      env: {
        ...withoutCi(process.env),
        NB_STUDIO_KEYCHAIN: 'off',
        ...options.env,
      },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()));
    child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}
