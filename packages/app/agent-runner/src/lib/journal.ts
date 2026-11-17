import {
  appendJournal,
  createLogLineSanitizer,
  createLogOutput,
  createLogger,
  LogLineFramer,
  pruneJournals,
  type JournalEntry,
} from '@nocobase/logging';
import { readdir, lstat, rmdir } from 'node:fs/promises';
import path from 'node:path';
import type { RunnerSettings } from './config.ts';
import { type RunnerPaths, runLogPath, removeEmptyStderr } from './home.ts';
import { readRecords, isAlive } from '../core/supervisor.ts';

/** The launcher alone owns daemon files; foreground daemons own them when no launcher captures stdout. */
export class RunnerJournal {
  private readonly output;
  private readonly lines;
  private readonly errors;
  constructor(
    directory: string,
    settings: Pick<RunnerSettings, 'logRetentionDays'> = {},
  ) {
    this.output = createLogOutput({
      file: {
        directory,
        name: 'runner',
        retentionDays: settings.logRetentionDays ?? 7,
        retentionOnly: true,
        maxFileSizeMB: 5,
      },
    });
    const frame = (level: string) => {
      const redactLine = createLogLineSanitizer();
      return new LogLineFramer(
        (input) => {
          let entry: JournalEntry;
          try {
            if (level === 'error') throw new Error('raw');
            const parsed = JSON.parse(input) as JournalEntry;
            if (
              typeof parsed.msg !== 'string' ||
              !['string', 'number'].includes(typeof parsed.level)
            )
              throw new Error('raw');
            entry = {
              ...parsed,
              msg: redactLine(parsed.msg),
              time:
                typeof parsed.time === 'string' &&
                Number.isFinite(Date.parse(parsed.time))
                  ? parsed.time
                  : new Date().toISOString(),
            };
          } catch {
            entry = {
              time: new Date().toISOString(),
              level,
              msg: redactLine(input),
            };
          }
          this.output.writeEntry(entry);
        },
        () =>
          this.output.writeEntry({
            time: new Date().toISOString(),
            level: 'warn',
            msg: 'Oversized output line omitted',
            truncated: true,
          }),
      );
    };
    this.lines = frame('info');
    this.errors = frame('error');
  }
  write(data: Buffer | string): void {
    this.lines.write(data);
  }
  writeError(data: Buffer | string): void {
    this.errors.write(data);
  }
  flush(): void {
    this.lines.flush();
    this.errors.flush();
  }
}

/** Each worker writes only its own UTC-dated file, including raw console output and crash stacks. */
export function workerJournal(
  paths: RunnerPaths,
  runId: string,
  maxSizeMB = 50,
): {
  log: (message: string) => void;
  flush: () => void;
} {
  const write = (level: string, msg: string) =>
    appendJournal(
      runLogPath(paths, runId),
      { time: new Date().toISOString(), level, msg, runId },
      maxSizeMB,
    );
  const frames = ['info', 'error'].map((level) => {
    const redactLine = createLogLineSanitizer();
    return new LogLineFramer(
      (line) => write(level, redactLine(line)),
      () => write('warn', 'Oversized output line omitted'),
    );
  });
  for (const [index, stream] of [process.stdout, process.stderr].entries()) {
    stream.write = (
      chunk: string | Uint8Array,
      encoding?: BufferEncoding | ((error?: Error | null) => void),
      callback?: (error?: Error | null) => void,
    ) => {
      frames[index].write(
        typeof chunk === 'string'
          ? Buffer.from(chunk, typeof encoding === 'string' ? encoding : 'utf8')
          : Buffer.from(chunk),
      );
      (typeof encoding === 'function' ? encoding : callback)?.();
      return true;
    };
  }
  process.on('uncaughtExceptionMonitor', (error) =>
    write('fatal', error.stack ?? error.message),
  );
  return {
    log: (message) => write('info', message),
    flush: () => frames.forEach((frame) => frame.flush()),
  };
}

export function daemonLogger(
  paths: RunnerPaths,
  settings: RunnerSettings,
): (message: string) => void {
  const destination = createLogOutput({
    file: {
      directory: paths.logsDir,
      name: 'runner',
      enabled: process.env.NOCOBASE_RUNNER_LOG_PIPE !== '1',
      retentionDays: settings.logRetentionDays ?? 7,
      retentionOnly: true,
      maxFileSizeMB: 5,
    },
    console: { enabled: true },
  });
  const logger = createLogger({ level: 'info' }, destination);
  return (message) => logger.info(message);
}

/** Time-only retention; live empty crash sidecars remain open for possible native failures. */
export async function pruneRunnerLogs(
  paths: RunnerPaths,
  settings: RunnerSettings,
): Promise<void> {
  const active = (await readRecords(paths)).filter((record) =>
    isAlive(record.pid),
  );
  const activeIds = new Set(active.map((record) => record.runId));
  const runs = path.join(paths.logsDir, 'runs');
  if (
    await lstat(runs)
      .then((stat) => stat.isSymbolicLink())
      .catch(() => false)
  )
    throw new Error('Symbolic log directories are not allowed');
  await pruneJournals(
    paths.logsDir,
    {
      retentionDays: settings.logRetentionDays ?? 7,
    },
    undefined,
    { recursive: true, retentionOnly: true },
  );
  for (const entry of await readdir(runs, { withFileTypes: true }).catch(
    () => [],
  )) {
    if (!entry.isDirectory() || !/^\d{4}-\d{2}-\d{2}$/.test(entry.name))
      continue;
    const directory = path.join(runs, entry.name);
    for (const name of await readdir(directory)) {
      const match = /^([a-zA-Z0-9_-]+)\.stderr$/.exec(name);
      if (match && !activeIds.has(match[1]))
        await removeEmptyStderr(path.join(directory, name));
    }
    await rmdir(path.join(runs, entry.name)).catch(
      (error: NodeJS.ErrnoException) => {
        // A worker may create a log between pruning and directory removal.
        if (
          error.code !== 'ENOENT' &&
          error.code !== 'ENOTEMPTY' &&
          error.code !== 'EEXIST'
        )
          throw error;
      },
    );
  }
}
