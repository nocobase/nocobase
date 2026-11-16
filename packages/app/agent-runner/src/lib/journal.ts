import {
  appendJournal,
  createLogLineSanitizer,
  createLogOutput,
  createLogger,
  LogLineFramer,
  pruneJournals,
  type JournalEntry,
} from '@nocobase/logging';
import { readdir, lstat } from 'node:fs/promises';
import path from 'node:path';
import type { RunnerSettings } from './config.ts';
import { type RunnerPaths, runLogPath } from './home.ts';
import { readRecords, isAlive } from '../core/supervisor.ts';

/** The launcher alone owns daemon files; foreground daemons own them when no launcher captures stdout. */
export class RunnerJournal {
  private readonly output;
  private readonly lines;
  private readonly errors;
  constructor(
    directory: string,
    settings: Pick<RunnerSettings, 'logRetentionDays' | 'logMaxSizeMB'> = {},
  ) {
    this.output = createLogOutput({
      file: {
        directory,
        name: 'runner',
        retentionDays: settings.logRetentionDays ?? 7,
        maxTotalSizeMB: settings.logMaxSizeMB ?? 500,
        maxFileSizeMB: Math.min(5, settings.logMaxSizeMB ?? 500),
      },
    });
    const frame = (level: string) => {
      const redactLine = createLogLineSanitizer();
      return new LogLineFramer(
        (input) => {
          const line = redactLine(input);
          let entry: JournalEntry;
          try {
            const parsed = JSON.parse(line) as JournalEntry;
            if (
              typeof parsed.msg !== 'string' ||
              !['string', 'number'].includes(typeof parsed.level)
            )
              throw new Error('raw');
            entry = {
              ...parsed,
              time:
                typeof parsed.time === 'string' &&
                Number.isFinite(Date.parse(parsed.time))
                  ? parsed.time
                  : new Date().toISOString(),
            };
          } catch {
            entry = { time: new Date().toISOString(), level, msg: line };
          }
          this.output.write(JSON.stringify(entry));
        },
        () =>
          this.output.write(
            JSON.stringify({
              time: new Date().toISOString(),
              level: 'warn',
              msg: 'Oversized output line omitted',
              truncated: true,
            }),
          ),
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
  maxSizeMB = 500,
): {
  log: (message: string) => void;
  flush: () => void;
  setMaxSizeMB: (size: number) => void;
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
    setMaxSizeMB: (size) => {
      maxSizeMB = size;
    },
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
      maxTotalSizeMB: settings.logMaxSizeMB ?? 500,
      maxFileSizeMB: Math.min(5, settings.logMaxSizeMB ?? 500),
    },
    console: { enabled: true },
  });
  const logger = createLogger({ level: 'info' }, destination);
  return (message) => logger.info(message);
}

/** Shared budget across daemon and run logs; every date of every live worker remains protected. */
export async function pruneRunnerLogs(
  paths: RunnerPaths,
  settings: RunnerSettings,
): Promise<void> {
  const active = (await readRecords(paths)).filter((record) =>
    isAlive(record.pid),
  );
  const protectedFiles: string[] = active.flatMap((record) =>
    record.log && !path.relative(paths.logsDir, record.log).startsWith('..')
      ? [record.log]
      : [],
  );
  const today = new Date().toISOString().slice(0, 10);
  const currentDaemon = (await readdir(paths.logsDir).catch(() => []))
    .filter(
      (name) => name.startsWith(`runner.${today}.`) && name.endsWith('.log'),
    )
    .sort()
    .at(-1);
  if (currentDaemon) protectedFiles.push(currentDaemon);
  const runs = path.join(paths.logsDir, 'runs');
  if (
    await lstat(runs)
      .then((stat) => stat.isSymbolicLink())
      .catch(() => false)
  )
    throw new Error('Symbolic log directories are not allowed');
  for (const date of await readdir(runs).catch(() => [])) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    for (const record of active)
      protectedFiles.push(
        path.relative(paths.logsDir, runLogPath(paths, record.runId, date)),
      );
  }
  await pruneJournals(
    paths.logsDir,
    {
      retentionDays: settings.logRetentionDays ?? 7,
      maxSizeMB: settings.logMaxSizeMB ?? 500,
    },
    protectedFiles,
    { recursive: true },
  );
}
