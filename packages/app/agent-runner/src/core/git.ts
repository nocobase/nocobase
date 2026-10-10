// Low-level Git for runner-owned directories. Task checkouts must use task-git.ts instead.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

export class CheckoutError extends Error {
  override name = 'CheckoutError';
}

/** An HTTPS token git fetches with, for one invocation (a job's `repo.auth`). */
export interface GitAuth {
  readonly username?: string;
  readonly token: string;
}

/** Pass an Authorization header through the environment, never the command line or a configuration file. */
export function gitAuthEnv(
  auth: GitAuth | undefined,
  scope?: string,
): Record<string, string> {
  if (auth === undefined) return {};
  const basic = Buffer.from(
    `${auth.username ?? 'x-access-token'}:${auth.token}`,
  ).toString('base64');
  return {
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0:
      scope === undefined ? 'http.extraHeader' : `http.${scope}.extraHeader`,
    GIT_CONFIG_VALUE_0: `Authorization: Basic ${basic}`,
  };
}

export async function git(
  args: string[],
  cwd?: string,
  env: Record<string, string> = {},
): Promise<string> {
  try {
    const { stdout } = await run('git', args, {
      cwd,
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: '0',
        GIT_ASKPASS: 'echo',
        ...env,
      },
      maxBuffer: 16 * 1024 * 1024,
    });
    return stdout.trim();
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr?.trim();
    throw new CheckoutError(
      `git ${args.join(' ')} failed${stderr ? `: ${stderr}` : ''}`,
    );
  }
}

export async function gitOk(
  args: string[],
  cwd?: string,
  env: Record<string, string> = {},
): Promise<boolean> {
  try {
    await git(args, cwd, env);
    return true;
  } catch {
    return false;
  }
}
