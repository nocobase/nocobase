import { spawn } from 'node:child_process';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { BackupError, checkAbort } from './errors.js';

export interface ClientOptions {
  env?: NodeJS.ProcessEnv;
  input?: string;
  output?: string;
  signal?: AbortSignal;
  /** These diagnostics are interpreted here and never returned to the caller. */
  exportPermission?: RegExp;
}

export function connectionEnvironment(): NodeJS.ProcessEnv {
  return Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) => !/^(PG|MYSQL|MARIADB)/i.test(key),
    ),
  );
}

export async function runClient(
  tool: string,
  args: readonly string[],
  options?: ClientOptions,
): Promise<void> {
  const signal = options?.signal;
  checkAbort(signal);
  const child = spawn(tool, args, {
    env: options?.env ?? connectionEnvironment(),
    stdio: [
      options?.input ? 'pipe' : 'ignore',
      options?.output ? 'pipe' : 'ignore',
      'pipe',
    ],
    signal,
  });
  let diagnostic = '';
  child.stderr?.setEncoding('utf8').on('data', (chunk: string) => {
    diagnostic = (diagnostic + chunk).slice(-16384);
  });
  let launchError: Error | undefined;
  child.on('error', (error: Error) => {
    launchError = error;
  });
  const exited = new Promise<{
    code: number | null;
    signal: NodeJS.Signals | null;
  }>((resolve) => {
    child.once('close', (code, signal) => resolve({ code, signal }));
  });
  const streams: Promise<void>[] = [];
  if (options?.input && child.stdin)
    streams.push(
      pipeline(createReadStream(options.input), child.stdin, { signal }),
    );
  if (options?.output && child.stdout) {
    streams.push(
      pipeline(
        child.stdout,
        createWriteStream(options.output, { flags: 'wx', mode: 0o600 }),
        { signal },
      ).catch((error: unknown) => {
        child.kill();
        throw error;
      }),
    );
  }
  const [exit, results] = await Promise.all([
    exited,
    Promise.allSettled(streams),
  ]);
  checkAbort(signal);
  const context = { tool: tool.split(/[\\/]/).at(-1) };
  if (launchError && 'code' in launchError && launchError.code === 'ENOENT') {
    throw new BackupError(
      'BACKUP_CLIENT_MISSING',
      'A required database client executable could not be found.',
      context,
    );
  }
  if (exit.signal) {
    throw new BackupError(
      'BACKUP_CLIENT_INTERRUPTED',
      'A database client was interrupted.',
      { ...context, signal: exit.signal },
    );
  }
  const ioFailed = results.some((result) => result.status === 'rejected');
  if (
    !launchError &&
    !ioFailed &&
    options?.exportPermission?.test(diagnostic)
  ) {
    throw new BackupError(
      'BACKUP_EXPORT_DENIED',
      'The database account cannot export this database.',
      context,
    );
  }
  if (launchError || exit.code !== 0 || ioFailed) {
    throw new BackupError(
      'BACKUP_CLIENT_FAILED',
      'A database client did not complete successfully.',
      { ...context, exitCode: exit.code },
    );
  }
}
