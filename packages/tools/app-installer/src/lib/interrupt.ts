import { EXIT_FAILED, InstallerError } from './errors.ts';

/**
 * SIGINT and SIGTERM stop the step that is running, not the installer. The step fails with `INTERRUPTED`, and the
 * command's own failure handling runs as it would for any other failure: an install removes what it wrote, an upgrade
 * after the switch rolls back. A second signal exits at once, whatever that leaves behind.
 */
let pending = false;
let received = 0;
const listeners = new Set<() => void>();

export function interruptError(): InstallerError {
  return new InstallerError(
    'INTERRUPTED',
    'Interrupted; the step that was running was stopped.',
    { exitCode: EXIT_FAILED },
  );
}

/** Reports a pending interrupt once. The step that sees it fails; the recovery steps after it run normally. */
export function takeInterrupt(): boolean {
  if (!pending) return false;
  pending = false;
  return true;
}

export function throwIfInterrupted(): void {
  if (takeInterrupt()) throw interruptError();
}

/** Called for each interrupt, so running child processes can be stopped. */
export function onInterrupt(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function installInterruptHandlers(
  stderr: NodeJS.WritableStream = process.stderr,
): () => void {
  const handler = (signal: NodeJS.Signals) => {
    received += 1;
    if (received > 1) {
      stderr.write(`\n${signal} again; exiting now.\n`);
      process.exit(130);
    }
    pending = true;
    stderr.write(
      `\n${signal} received; stopping the current step and cleaning up. Send it again to exit immediately.\n`,
    );
    for (const listener of listeners) listener();
  };
  process.on('SIGINT', handler);
  process.on('SIGTERM', handler);
  return () => {
    process.off('SIGINT', handler);
    process.off('SIGTERM', handler);
    pending = false;
    received = 0;
  };
}
