import { spawn, type ChildProcess } from 'node:child_process';
import { interruptError, onInterrupt, takeInterrupt } from './interrupt.ts';

export interface RunCommandOptions {
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

/**
 * Signals the child's whole process group. `pnpm build` runs `tsc`, `vite` and native builds as its own children; killing
 * only `pnpm` would leave them writing into a directory the caller is about to remove.
 */
function signalGroup(child: ChildProcess, signal: NodeJS.Signals): void {
  if (child.pid === undefined) return;
  try {
    process.kill(-child.pid, signal);
  } catch {
    child.kill(signal);
  }
}

/**
 * Runs a child process, collecting its output, and rejects with `CommandFailedError` on a non-zero exit. The child leads
 * its own process group, so a timeout or an interrupt stops everything it started, and the promise settles only once
 * the group has exited.
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
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    });

    let stdout = '';
    let stderr = '';
    let stopReason: 'timeout' | 'interrupt' | undefined;
    let killTimer: NodeJS.Timeout | undefined;
    const stop = (reason: 'timeout' | 'interrupt') => {
      if (stopReason) return;
      stopReason = reason;
      signalGroup(child, 'SIGTERM');
      killTimer = setTimeout(
        () => signalGroup(child, 'SIGKILL'),
        KILL_GRACE_MS,
      );
      killTimer.unref();
    };
    const timer = options.timeoutMs
      ? setTimeout(() => stop('timeout'), options.timeoutMs)
      : undefined;
    timer?.unref();
    const stopListening = onInterrupt(() => stop('interrupt'));

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
      options.echo?.write(chunk);
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
      options.echo?.write(chunk);
    });

    const settle = () => {
      clearTimeout(timer);
      clearTimeout(killTimer);
      stopListening();
    };
    child.once('error', (error: Error) => {
      settle();
      reject(error);
    });
    child.once('close', (code: number | null) => {
      settle();
      if (stopReason === 'interrupt') {
        // The interrupt is this step's failure; later recovery steps must not see it again.
        takeInterrupt();
        reject(interruptError());
        return;
      }
      if (stopReason === 'timeout') {
        reject(
          new CommandFailedError(
            label,
            code,
            stdout,
            stderr,
            `${label} timed out after ${Math.round(options.timeoutMs! / 1000)}s.`,
          ),
        );
        return;
      }
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new CommandFailedError(label, code, stdout, stderr));
    });
  });

/** The last `lines` lines of a command's output, for an error message that has to fit on a screen. */
export function tail(text: string, lines = 20): string {
  return text.trimEnd().split('\n').slice(-lines).join('\n');
}
