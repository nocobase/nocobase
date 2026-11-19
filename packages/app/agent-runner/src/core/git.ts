// Low-level Git for runner-owned directories. Task checkouts must use task-git.ts instead.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { GitSshFailure } from '../protocol/index.ts';
import { classifySshFailure, SSH_FAILURE_MESSAGES } from './ssh-command.ts';

const run = promisify(execFile);

export class CheckoutError extends Error {
  override name = 'CheckoutError';
}

export class GitSshError extends CheckoutError {
  readonly failure: GitSshFailure;

  constructor(failure: GitSshFailure) {
    super(SSH_FAILURE_MESSAGES[failure]);
    this.failure = failure;
  }
}

export function gitSshFailureOf(error: unknown): GitSshFailure | undefined {
  if (error instanceof GitSshError) return error.failure;
  return error instanceof Error && error.cause !== undefined
    ? gitSshFailureOf(error.cause)
    : undefined;
}

/** An HTTPS token git fetches with, and the username its code host expects with it (`oauth2`, `x-access-token`). */
export interface GitAuth {
  readonly username: string;
  readonly token: string;
}

/** Pass an Authorization header through the environment and clear host helpers, preventing credential fallback. */
export function gitAuthEnv(
  auth: GitAuth | undefined,
  scope?: string,
): Record<string, string> {
  if (auth === undefined) return {};
  const basic = Buffer.from(`${auth.username}:${auth.token}`).toString(
    'base64',
  );
  return {
    GIT_CONFIG_COUNT: '2',
    GIT_CONFIG_KEY_0:
      scope === undefined ? 'http.extraHeader' : `http.${scope}.extraHeader`,
    GIT_CONFIG_VALUE_0: `Authorization: Basic ${basic}`,
    GIT_CONFIG_KEY_1: 'credential.helper',
    GIT_CONFIG_VALUE_1: '',
  };
}

export interface GitInvocationOptions {
  readonly signal?: AbortSignal;
  /** Quiesce descendant writers before the enclosing cache lock is released after an abort. */
  readonly onAbort?: () => Promise<void>;
}

export async function git(
  args: string[],
  cwd?: string,
  env: Record<string, string> = {},
  options: GitInvocationOptions = {},
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
      ...(options.signal === undefined ? {} : { signal: options.signal }),
    });
    return stdout.trim();
  } catch (error) {
    if (options.signal?.aborted === true) await options.onAbort?.();
    const stderr = (error as { stderr?: string }).stderr;
    if (env.GIT_SSH_COMMAND !== undefined) {
      const failure = classifySshFailure(stderr ?? '', args.includes('push'));
      if (failure !== undefined) throw new GitSshError(failure);
    }
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
