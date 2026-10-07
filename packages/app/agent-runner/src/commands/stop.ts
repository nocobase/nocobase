import { Flags, type Interfaces } from '@oclif/core';

import { RunnerCommand } from '../lib/command.ts';
import { delay } from '../lib/http.ts';
import { removeFile } from '../lib/home.ts';
import { readDaemonPid } from '../core/loop.ts';
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
    const running = await readDaemonPid(this.paths);
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
