import { Flags, type Interfaces } from '@oclif/core';

import { RunnerCommand, UsageError } from '../lib/command.ts';
import { delay } from '../lib/http.ts';
import { removeFile, readJson } from '../lib/home.ts';
import { readLauncherPid } from '../core/launcher.ts';
import { EXIT_CODES } from '../protocol/index.ts';
import { readDaemonPid, type DaemonPid } from '../core/loop.ts';
import { isAlive } from '../core/supervisor.ts';

export default class Stop extends RunnerCommand {
  static override summary: string = 'Stop the runner daemon.';
  static override description: string =
    'Running runs are stopped and reported as failed with runnerOffline, so the server can hand them to another runner.';
  static override flags: {
    timeout: Interfaces.OptionFlag<number>;
  } = {
    timeout: Flags.integer({
      description: 'Seconds to wait before killing the daemon.',
      default: 30,
    }),
  };

  async run(): Promise<{ stopped: boolean; pid?: number }> {
    const { flags } = await this.parse(Stop);
    const launcher = await readLauncherPid(this.paths);
    const running = await readDaemonPid(this.paths);
    if (launcher !== undefined) {
      const signal = (name: NodeJS.Signals): void => {
        try {
          process.kill(launcher.pid, name);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error;
        }
      };
      const active = async (): Promise<boolean> =>
        (await readLauncherPid(this.paths))?.pid === launcher.pid;
      // Signal the owner of the retry loop, even when it currently has no daemon child.
      signal('SIGTERM');
      const deadline = Date.now() + flags.timeout * 1000;
      while ((await active()) && Date.now() < deadline) await delay(100);
      if (await active()) {
        this.warn(
          `The runner did not stop within ${flags.timeout} s; asking its launcher to kill the daemon. Its runs are recovered on next start.`,
        );
        signal('SIGUSR2');
        const forcedDeadline = Date.now() + 5_000;
        while ((await active()) && Date.now() < forcedDeadline)
          await delay(100);
        if (await active())
          throw new UsageError(
            'The runner launcher did not stop; inspect the service and its log before restarting.',
            EXIT_CODES.general,
          );
      }
      // A killed child cannot remove its own record. Do not remove a later daemon's record.
      const recorded = await readJson<DaemonPid>(this.paths.daemonPid);
      if (running !== undefined && recorded?.pid === running.pid)
        await removeFile(this.paths.daemonPid);
      this.log(`Runner stopped (launcher pid ${launcher.pid}).`);
      return { stopped: true, pid: running?.pid ?? launcher.pid };
    }
    if (running === undefined) {
      this.log('The runner is not running.');
      return { stopped: false };
    }
    process.kill(running.pid, 'SIGTERM');
    const deadline = Date.now() + flags.timeout * 1000;
    while (isAlive(running.pid) && Date.now() < deadline) await delay(200);
    if (isAlive(running.pid)) {
      this.warn(
        `The runner did not stop within ${flags.timeout} s; killing it. Its runs are recovered on next start.`,
      );
      process.kill(running.pid, 'SIGKILL');
      await removeFile(this.paths.daemonPid);
    }
    this.log(`Runner stopped (pid ${running.pid}).`);
    return { stopped: true, pid: running.pid };
  }
}
