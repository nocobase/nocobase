import path from 'node:path';
import { InstallerError, type Suggestion } from './errors.ts';
import { formatCommandLine } from './invocation.ts';
import {
  CommandFailedError,
  runCommand,
  tail,
  type RunCommand,
} from './run-command.ts';

/** The application CLI's `--json` envelope, as far as the installer reads it. */
export interface AppCliEnvelope {
  ok: boolean;
  command?: string;
  status?: string;
  result?: unknown;
  error?: {
    code?: string;
    message?: string;
    suggestions?: {
      message?: string;
      run?: { command: string; args: string[] } | string;
    }[];
  };
}

/**
 * Carries a suggestion of the release's CLI over into the installer's error, with its command folded into the message.
 * None of them runs as-is from an installation root: they name the release's own `dist/cli/index.js`, which a failed
 * install or upgrade has already removed and which reads the wrong configuration without `app.env`, or `pnpm add`,
 * which would turn the installation root into a project.
 */
export function toSuggestion(
  entry: NonNullable<
    NonNullable<AppCliEnvelope['error']>['suggestions']
  >[number],
): Suggestion {
  const run =
    typeof entry.run === 'string'
      ? entry.run
      : entry.run
        ? formatCommandLine(entry.run)
        : undefined;
  const message = entry.message ?? '';
  return {
    message: run
      ? [message, `(the application CLI's command: ${run})`]
          .filter(Boolean)
          .join(' ')
      : message,
  };
}

export interface AppCliOptions {
  /** The release's deployment root, holding `dist/`. */
  releaseDir: string;
  /** Working directory for the command; the installer root. */
  cwd: string;
  /** `app.env` values, applied over the installer's own environment. */
  env: Record<string, string>;
  run?: RunCommand;
}

/**
 * The command as it may appear in a message: `config set` values are masked, since a `--set` may carry a secret that
 * would otherwise end up in the JSON result and the terminal. `--from-env` pairs name a variable, not a value, and stay.
 */
export function describeAppCommand(args: readonly string[]): string {
  const setting = args[0] === 'config' && args[1] === 'set';
  let fromEnv = false;
  const shown = args.map((arg) => {
    if (arg === '--from-env') fromEnv = true;
    if (!setting || fromEnv || arg.startsWith('-')) return arg;
    const index = arg.indexOf('=');
    return index > 0 ? `${arg.slice(0, index + 1)}***` : arg;
  });
  return `nocobase ${shown.join(' ')}`;
}

/**
 * Runs the release's own CLI, `node <release>/dist/cli/index.js <args> --json`, and returns its envelope. It is the code
 * that runs in production, so configuration and migrations are checked by the same version that will serve them.
 */
export async function runAppCli(
  args: readonly string[],
  options: AppCliOptions,
): Promise<AppCliEnvelope> {
  const entry = path.join(options.releaseDir, 'dist/cli/index.js');
  const label = describeAppCommand(args);
  const run = options.run ?? runCommand;
  let stdout: string;
  let stderr: string;
  try {
    ({ stdout, stderr } = await run(
      process.execPath,
      [entry, ...args, '--json'],
      {
        cwd: options.cwd,
        env: { ...process.env, ...options.env },
        timeoutMs: 30 * 60_000,
      },
    ));
  } catch (error) {
    if (!(error instanceof CommandFailedError)) throw error;
    stdout = error.stdout;
    stderr = error.stderr;
  }

  let envelope: AppCliEnvelope;
  try {
    envelope = JSON.parse(stdout) as AppCliEnvelope;
  } catch {
    throw new InstallerError(
      'APP_CLI_FAILED',
      `${label} did not print a JSON result.`,
      { details: { stderr: tail(stderr), stdout: tail(stdout) } },
    );
  }
  if (!envelope.ok) {
    throw new InstallerError(
      envelope.error?.code ?? 'APP_CLI_FAILED',
      `${label} failed: ${envelope.error?.message ?? 'no message'}`,
      {
        suggestions: (envelope.error?.suggestions ?? []).map(toSuggestion),
        details: { command: label },
      },
    );
  }
  return envelope;
}

/**
 * Counts the migration and seed tasks a `db apply --dry-run` would run. `status` is not a reliable signal: a dry run
 * reports `success-noop` even when tasks are pending, so the plan itself is read.
 */
export function pendingTaskCount(envelope: AppCliEnvelope): number {
  const plan = (
    envelope.result as { plan?: { tasks?: unknown[] }[] } | undefined
  )?.plan;
  return (plan ?? []).reduce(
    (count, entry) => count + (entry.tasks?.length ?? 0),
    0,
  );
}
