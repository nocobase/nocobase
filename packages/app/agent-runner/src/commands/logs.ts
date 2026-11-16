import { Flags, type Interfaces } from '@oclif/core';
import { constants } from 'node:fs';
import { lstat, open, readdir } from 'node:fs/promises';
import path from 'node:path';
import { RunnerCommand, UsageError } from '../lib/command.ts';
import { safeName } from '../lib/home.ts';
import { EXIT_CODES } from '../protocol/index.ts';

export default class Logs extends RunnerCommand {
  static override summary: string =
    "Print the runner daemon's log, or one run's.";
  static override enableJsonFlag = false;
  static override flags: {
    run: Interfaces.OptionFlag<string | undefined>;
    lines: Interfaces.OptionFlag<number>;
    follow: Interfaces.BooleanFlag<boolean>;
  } = {
    run: Flags.string({ description: "Print this run's worker log instead." }),
    lines: Flags.integer({
      char: 'n',
      description: 'How many lines from the end (at most 1 MiB).',
      default: 100,
      min: 1,
    }),
    follow: Flags.boolean({
      char: 'f',
      description: 'Keep printing what is appended, across UTC date rotation.',
    }),
  };
  async run(): Promise<void> {
    const { flags } = await this.parse(Logs);
    const files = async (): Promise<string[]> => {
      const directory = this.paths.logsDir;
      if (!(await lstat(directory).catch(() => undefined))?.isDirectory())
        return [];
      if (!flags.run)
        return (await readdir(directory))
          .filter((name) => /^runner\.\d{4}-\d{2}-\d{2}\.\d+\.log$/.test(name))
          .sort()
          .map((name) => path.join(directory, name));
      const runs = path.join(directory, 'runs');
      if (!(await lstat(runs).catch(() => undefined))?.isDirectory()) return [];
      const result: string[] = [];
      const modified = new Map<string, number>();
      for (const date of (await readdir(runs)).sort()) {
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
          !(await lstat(path.join(runs, date))).isDirectory()
        )
          continue;
        for (const extension of ['log', 'stderr']) {
          const file = path.join(
            runs,
            date,
            `${safeName(flags.run)}.${extension}`,
          );
          const stats = await lstat(file).catch(() => undefined);
          if (stats?.isFile()) {
            result.push(file);
            modified.set(file, stats.mtimeMs);
          }
        }
      }
      return result.sort(
        (a, b) => modified.get(a)! - modified.get(b)! || a.localeCompare(b),
      );
    };
    let current = (await files()).at(-1);
    if (!current)
      throw new UsageError('No journal is available.', EXIT_CODES.notFound);
    const initialLines: string[] = [];
    let initialBytes = 0;
    const positions = new Map<string, { offset: number; inode: number }>();
    const read = async (initial: boolean) => {
      const candidates = await files();
      const index = current ? candidates.indexOf(current) : -1;
      const selected = flags.run
        ? candidates
        : initial
          ? candidates.slice(-1)
          : candidates.slice(index < 0 ? -1 : index);
      for (const file of selected) {
        let handle;
        try {
          handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
          const info = await handle.stat();
          if (!info.isFile()) continue;
          const previous = positions.get(file);
          let offset =
            previous?.inode === info.ino && previous.offset <= info.size
              ? previous.offset
              : 0;
          current = file;
          const firstRead = initial || !previous;
          if (firstRead) offset = Math.max(0, info.size - 1024 * 1024);
          const started = offset;
          if (firstRead) {
            const data = Buffer.alloc(info.size - offset);
            const { bytesRead } = await handle.read(
              data,
              0,
              data.length,
              offset,
            );
            offset += bytesRead;
            const lines = data
              .subarray(0, bytesRead)
              .toString('utf8')
              .split('\n');
            if (started) lines.shift();
            if (lines.at(-1) === '') lines.pop();
            for (const line of lines.slice(-flags.lines)) {
              if (!initial) this.log(line);
              else {
                initialLines.push(line);
                initialBytes += Buffer.byteLength(line) + 1;
                while (
                  initialLines.length > flags.lines ||
                  initialBytes > 1024 * 1024
                )
                  initialBytes -= Buffer.byteLength(initialLines.shift()!) + 1;
              }
            }
          } else {
            while (offset < info.size) {
              const data = Buffer.alloc(
                Math.min(32 * 1024, info.size - offset),
              );
              const { bytesRead } = await handle.read(
                data,
                0,
                data.length,
                offset,
              );
              if (!bytesRead) break;
              offset += bytesRead;
              await new Promise<void>((resolve, reject) =>
                process.stdout.write(data.subarray(0, bytesRead), (error) =>
                  error ? reject(error) : resolve(),
                ),
              );
            }
          }
          positions.set(file, { inode: info.ino, offset });
        } catch (error) {
          if (
            !['ENOENT', 'ELOOP'].includes(
              (error as NodeJS.ErrnoException).code ?? '',
            )
          )
            throw error;
        } finally {
          await handle?.close();
        }
      }
    };
    await read(true);
    for (const line of initialLines) this.log(line);
    if (!flags.follow) return;
    await new Promise<void>((resolve, reject) => {
      let pending = Promise.resolve();
      const update = () => {
        pending = pending.then(() => read(false)).catch(reject);
      };
      const timer = setInterval(update, 500);
      const stop = () => {
        clearInterval(timer);
        void pending.then(resolve, reject);
      };
      process.once('SIGINT', stop);
      update();
    });
  }
}
