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
 * Keep the test CLI independent of CI metadata and the invoking runner's Studio identity.
 */
function isolatedEnvironment(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
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

/** Runs the test CLI with only its explicitly supplied Studio identity. */
export function runStudioCli(
  args: readonly string[],
  options: { cwd: string; env?: NodeJS.ProcessEnv },
): Promise<StudioCliResult> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [STUDIO_CLI_BIN, ...args], {
      cwd: options.cwd,
      env: { ...isolatedEnvironment(process.env), ...options.env },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()));
    child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}
