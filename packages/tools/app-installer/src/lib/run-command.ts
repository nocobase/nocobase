import { execFile, spawn } from 'node:child_process';
import { interruptError, onInterrupt, takeInterrupt } from './interrupt.ts';

export interface RunCommandOptions {
  /** Input is sent through stdin, never included in command labels or errors. */
  input?: string;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
  /** Forward the child's output to this stream as it arrives, for commands a person should watch. */
  echo?: NodeJS.WritableStream;
}

export interface RunCommandResult {
  stdout: string;
  stderr: string;
}

export type RunCommand = (
  command: string,
  args: readonly string[],
  options?: RunCommandOptions,
) => Promise<RunCommandResult>;

export class CommandFailedError extends Error {
  public readonly command: string;
  public readonly exitCode: number | null;
  public readonly stdout: string;
  public readonly stderr: string;

  public constructor(
    command: string,
    exitCode: number | null,
    stdout: string,
    stderr: string,
    reason?: string,
  ) {
    super(
      reason ??
        `${command} failed${exitCode === null ? '' : ` with exit code ${exitCode}`}.`,
    );
    this.name = 'CommandFailedError';
    this.command = command;
    this.exitCode = exitCode;
    this.stdout = stdout;
    this.stderr = stderr;
  }
}

/** How long a stopped command's process group gets to exit after SIGTERM before it is killed. */
const KILL_GRACE_MS = 10_000;

/** A bounded confirmation period after SIGKILL, including slow process-state checks. */
const STOP_CHECK_MS = 2000;
const POLL_MS = 50;

/** Linux and macOS ps expose zombies as Z; they cannot execute or write, even before their parent reaps them. */
async function groupIsRunning(pid: number): Promise<boolean> {
  try {
    process.kill(-pid, 0);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ESRCH') return false;
    throw error;
  }
  const states = await new Promise<string>((resolve, reject) => {
    // Read only group ids and states, never command lines or environment values. BSD and Linux ps support these fields.
    execFile(
      'ps',
      ['-A', '-o', 'pgid=,stat='],
      {
        encoding: 'utf8',
        timeout: 1000,
        killSignal: 'SIGKILL',
        maxBuffer: 4 * 1024 * 1024,
      },
      (error, stdout) =>
        error
          ? reject(
              new Error('Cannot read command process states.', {
                cause: error,
              }),
            )
          : resolve(stdout),
    );
  });
  return states
    .trim()
    .split('\n')
    .some((line) => {
      const [group, state] = line.trim().split(/\s+/);
      return Number(group) === pid && !/^[ZX]/.test(state ?? '');
    });
}

/**
 * Runs a child process, collecting its output, and rejects with `CommandFailedError` on a non-zero exit. The child leads
 * its own process group, so a timeout or an interrupt stops everything it started, and the promise settles only once
 * the group has no runnable members. If that cannot be confirmed within the stop deadline, the failure says so.
 */
export const runCommand: RunCommand = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const label = [command, ...args].join(' ');
    if (takeInterrupt()) {
      reject(interruptError());
      return;
    }
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: [options.input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'],
      detached: true,
    });

    child.stdin?.on('error', () => {
      /* A child may exit before reading stdin; close reports its status. */
    });
    child.stdin?.end(options.input);

    let stdout = '';
    let stderr = '';
    let stopReason: 'timeout' | 'interrupt' | undefined;
    let settled = false;
    let closed = false;
    let groupStopped = false;
    let exitCode: number | null = null;
    let killTimer: NodeJS.Timeout | undefined;
    let pollTimer: NodeJS.Timeout | undefined;
    let deadlineTimer: NodeJS.Timeout | undefined;
    let stopError: unknown;
    const signalGroup = (signal: NodeJS.Signals) => {
      if (child.pid === undefined) return;
      try {
        process.kill(-child.pid, signal);
      } catch (error) {
        // The group may disappear between observing it and signalling it. Other errors must not imply success.
        if ((error as NodeJS.ErrnoException).code !== 'ESRCH')
          stopError = error;
      }
    };
    const checkStopped = async () => {
      try {
        const running =
          child.pid !== undefined && (await groupIsRunning(child.pid));
        if (settled) return;
        if (!running) {
          // Once every member is dead, none can create another member. Do not signal this group id again.
          groupStopped = true;
          clearTimeout(killTimer);
          if (closed) finish(exitCode);
          return;
        }
      } catch (error) {
        stopError = error;
      }
      if (!settled) pollTimer = setTimeout(() => void checkStopped(), POLL_MS);
    };
    const stop = (reason: 'timeout' | 'interrupt') => {
      if (stopReason || settled) return;
      stopReason = reason;
      signalGroup('SIGTERM');
      // These timers stay referenced even when the direct child closes its pipes and leaves no other Node handles.
      killTimer = setTimeout(() => signalGroup('SIGKILL'), KILL_GRACE_MS);
      deadlineTimer = setTimeout(() => {
        const detail =
          stopError instanceof Error ? ` ${stopError.message}` : '';
        finish(
          exitCode,
          `Could not confirm the command process group stopped.${detail}`,
        );
        child.stdin?.destroy();
        child.stdout?.destroy();
        child.stderr?.destroy();
        child.unref();
      }, KILL_GRACE_MS + STOP_CHECK_MS);
      void checkStopped();
    };
    const timer = options.timeoutMs
      ? setTimeout(() => stop('timeout'), options.timeoutMs)
      : undefined;
    timer?.unref();
    const stopListening = onInterrupt(() => stop('interrupt'));

    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
      options.echo?.write(chunk);
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
      options.echo?.write(chunk);
    });

    const finish = (
      code: number | null,
      cleanupFailure?: string,
      spawnFailure?: Error,
    ) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(killTimer);
      clearTimeout(pollTimer);
      clearTimeout(deadlineTimer);
      stopListening();
      if (spawnFailure) {
        reject(spawnFailure);
        return;
      }
      if (stopReason === 'interrupt') {
        // The interrupt is this step's failure; later recovery steps must not see it again.
        takeInterrupt();
        const error = interruptError();
        if (cleanupFailure) error.message = `Interrupted. ${cleanupFailure}`;
        reject(error);
        return;
      }
      if (stopReason === 'timeout') {
        reject(
          new CommandFailedError(
            label,
            code,
            stdout,
            stderr,
            `${label} timed out after ${Math.round(options.timeoutMs! / 1000)}s.${cleanupFailure ? ` ${cleanupFailure}` : ''}`,
          ),
        );
        return;
      }
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new CommandFailedError(label, code, stdout, stderr));
    };
    child.once('error', (error: Error) => {
      // A spawn failure has no process group. Errors after stopping begins must not bypass group confirmation.
      if (stopReason && child.pid !== undefined) stopError = error;
      else finish(null, undefined, error);
    });
    child.once('close', (code: number | null) => {
      closed = true;
      exitCode = code;
      if (!stopReason || groupStopped) finish(code);
    });
  });

/** The last `lines` lines of a command's output, for an error message that has to fit on a screen. */
export function tail(text: string, lines = 20): string {
  return text.trimEnd().split('\n').slice(-lines).join('\n');
}
