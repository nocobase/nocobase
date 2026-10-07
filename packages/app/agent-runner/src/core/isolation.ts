// Isolation of the deterministic steps the runner runs itself, a build job's command, as the owner's local policy
// configures it (`isolation`, runner/local-policy.ts). The
// agents' coding tools are sandboxed by their own adapters and are not affected.
//
// - `none` (the default): the steps run as the runner's user, as before.
// - `user` (macOS and Linux): the steps run as another, less privileged account through `sudo -n -u <user>`. The owner
//   creates the account, lets the runner's user run commands as it without a password (a sudoers rule such as
//   `runner ALL=(nocobase-build) NOPASSWD: ALL`), and gives it access to the runner's work root (a shared group with
//   group-writable directories, or an ACL). The runner checks once that `sudo -n -u <user> true` works; when it does
//   not, it takes no build job. The step's environment reaches the other user on standard
//   input, never in its arguments, so its secrets do not show in the process list.
// - `container`: not supported by this runner. It takes no build job, and says so.
import { spawn } from 'node:child_process';

import type { IsolationConfig } from './local-policy.ts';

/** How a deterministic step is started. */
export interface Isolation {
  /** What to spawn instead of `command args` with `env`; `stdin` is written to the process and closed. */
  wrap(
    command: string,
    args: readonly string[],
    env: Readonly<Record<string, string>>,
  ): {
    readonly command: string;
    readonly args: readonly string[];
    readonly env: Record<string, string>;
    readonly stdin?: string;
  };
}

/** The steps run as the runner's user. */
export const NO_ISOLATION: Isolation = {
  wrap: (command, args, env) => ({ command, args: [...args], env: { ...env } }),
};

/** What the other user's shell runs: the environment from standard input, then the step, with no input of its own. */
const LOADER = 'eval "$(cat)" && exec "$@" </dev/null';

const NAME = /^[A-Za-z_][A-Za-z0-9_]*$/u;

/** `value` as a single-quoted shell word. */
function quote(value: string): string {
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}

/** Runs the steps as `user` through `sudo -n`. */
export function userIsolation(user: string, sudo = 'sudo'): Isolation {
  return {
    wrap(command, args, env) {
      const script = Object.entries(env)
        .filter(([name]) => NAME.test(name))
        .map(([name, value]) => `export ${name}=${quote(value)}`)
        .join('\n');
      return {
        command: sudo,
        args: [
          '-n',
          '-u',
          user,
          '-H',
          '--',
          '/bin/sh',
          '-c',
          LOADER,
          'nocobase-runner-step',
          command,
          ...args,
        ],
        // sudo resets the environment anyway; it only needs to find itself.
        env: { PATH: env.PATH ?? process.env.PATH ?? '/usr/bin:/bin' },
        stdin: `${script}\n`,
      };
    },
  };
}

/** Whether `sudo -n -u <user> true` runs, within a few seconds. */
async function sudoWorks(user: string, sudo: string): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(sudo, ['-n', '-u', user, '--', 'true'], {
      stdio: 'ignore',
    });
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve(false);
    }, 5_000);
    timer.unref();
    child.once('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
    child.once('exit', (code) => {
      clearTimeout(timer);
      resolve(code === 0);
    });
  });
}

export type IsolationCheck =
  { readonly isolation: Isolation } | { readonly problem: string };

/**
 * The isolation `config` asks for, as this machine can give it, or why it cannot. `platform` and `sudo` are for tests.
 */
export async function checkIsolation(
  config: IsolationConfig,
  options: { readonly platform?: NodeJS.Platform; readonly sudo?: string } = {},
): Promise<IsolationCheck> {
  const platform = options.platform ?? process.platform;
  switch (config.mode) {
    case 'none':
      return { isolation: NO_ISOLATION };
    case 'container':
      return {
        problem:
          'running steps in a container is not supported by this runner; set isolation.mode to "user" or "none".',
      };
    case 'user': {
      if (platform !== 'darwin' && platform !== 'linux')
        return {
          problem: `running steps as another user is not supported on this platform (${platform}).`,
        };
      const user = config.user ?? '';
      const sudo = options.sudo ?? 'sudo';
      if (!(await sudoWorks(user, sudo)))
        return {
          problem: `"sudo -n -u ${user} true" does not run here; create the user and let this runner's user run commands as it without a password.`,
        };
      return { isolation: userIsolation(user, sudo) };
    }
  }
}

/** Why `config` cannot be had here, or undefined when it can. */
export async function isolationProblem(
  config: IsolationConfig,
): Promise<string | undefined> {
  const check = await checkIsolation(config);
  return 'problem' in check ? check.problem : undefined;
}
