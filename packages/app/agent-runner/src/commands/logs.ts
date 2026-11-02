import { Flags, type Interfaces } from '@oclif/core';
import {
  createReadStream,
  existsSync,
  statSync,
  watchFile,
  unwatchFile,
  type Stats,
} from 'node:fs';
import { open } from 'node:fs/promises';

import { RunnerCommand, UsageError } from '../lib/command.ts';
import { runLogPath } from '../lib/home.ts';
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
      description: 'How many lines from the end.',
      default: 100,
    }),
    follow: Flags.boolean({
      char: 'f',
      description: 'Keep printing what is appended.',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Logs);
    const file =
      flags.run === undefined
        ? this.paths.daemonLog
        : runLogPath(this.paths, flags.run);
    if (!existsSync(file))
      throw new UsageError(`No log at ${file}.`, EXIT_CODES.notFound);
    // Bind the initial bytes and inode to one descriptor, even if the path rotates.
    const handle = await open(file, 'r');
    let inode: number;
    let bytes: Buffer;
    try {
      inode = (await handle.stat()).ino;
      bytes = await handle.readFile();
    } finally {
      await handle.close();
    }
    let offset = bytes.length;
    const lines = bytes.toString('utf8').split('\n');
    if (lines[lines.length - 1] === '') lines.pop();
    for (const line of lines.slice(-flags.lines)) this.log(line);
    if (!flags.follow) return;
    await new Promise<void>((resolve) => {
      const follow = (current: Stats) => {
        if (current.nlink === 0) return;
        if (current.ino !== inode || current.size < offset) offset = 0;
        inode = current.ino;
        if (current.size === offset) return;
        createReadStream(file, { start: offset, end: current.size - 1 }).pipe(
          process.stdout,
          { end: false },
        );
        offset = current.size;
      };
      watchFile(file, { interval: 500 }, follow);
      // watchFile's first poll may already see the new file as its baseline.
      // Catch up explicitly so changes before watcher initialization are not lost.
      const current = statSync(file, { throwIfNoEntry: false });
      if (current) follow(current);
      process.once('SIGINT', () => {
        unwatchFile(file);
        resolve();
      });
    });
  }
}
