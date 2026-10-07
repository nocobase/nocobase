import { Flags, type Interfaces } from '@oclif/core';
import { lstat, readlink, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

import { RunnerCommand } from '../lib/command.ts';
import { readSettings } from '../lib/config.ts';
import { delay } from '../lib/http.ts';
import { removeFile } from '../lib/home.ts';
import { detectInstallation } from '../lib/install.ts';
import { selfCommand } from '../lib/self.ts';
import { runnerCommandLine, runnerHost } from '../host.ts';
import { readDaemonPid } from '../core/loop.ts';
import { servicePlan, uninstallService } from '../core/service.ts';
import { isAlive } from '../core/supervisor.ts';

interface UninstallResult {
  removed: string[];
  dryRun: boolean;
}

/** Whether `link` is a symbolic link into `dir`. */
async function linksInto(link: string, dir: string): Promise<boolean> {
  try {
    if (!(await lstat(link)).isSymbolicLink()) return false;
    const target = path.resolve(path.dirname(link), await readlink(link));
    return target === dir || target.startsWith(`${dir}${path.sep}`);
  } catch {
    return false;
  }
}

export default class Uninstall extends RunnerCommand {
  static override summary: string =
    'Stop the runner and remove its service and the installed program.';
  static override description: string =
    'Removes the user service, stops the daemon (its runs go back to the queue), and removes what the install ' +
    `script installed: the versions under the install prefix and the ${runnerHost().bin} command link. Registrations, ` +
    'keys, caches and logs in ~/.nocobase-runner stay unless --purge, which also removes the agents’ work directories. ' +
    'The application keeps showing the runtime, offline, until someone removes it on the Runtimes page.';
  static override flags: {
    purge: Interfaces.BooleanFlag<boolean>;
    'dry-run': Interfaces.BooleanFlag<boolean>;
  } = {
    purge: Flags.boolean({
      description:
        'Also remove ~/.nocobase-runner (registrations, keys, caches, logs) and the agents’ work directories.',
    }),
    'dry-run': Flags.boolean({
      description: 'Print what would be removed, and change nothing.',
    }),
  };

  async run(): Promise<UninstallResult> {
    const { flags } = await this.parse(Uninstall);
    const dryRun = flags['dry-run'];
    const paths = this.paths;
    const removed: string[] = [];
    const say = (message: string) =>
      this.log(dryRun ? `would: ${message}` : message);

    const settings = await readSettings(paths);
    const plan = (() => {
      try {
        return servicePlan({
          paths,
          command: selfCommand(),
          ...(settings.serviceLabel === undefined
            ? {}
            : { label: settings.serviceLabel }),
        });
      } catch {
        return undefined;
      }
    })();
    if (plan !== undefined && existsSync(plan.file)) {
      say(`remove the service ${plan.label} (${plan.file})`);
      if (!dryRun) await uninstallService(plan);
      removed.push(plan.file);
    }

    const daemon = await readDaemonPid(paths);
    if (daemon !== undefined) {
      say(`stop the runner (pid ${daemon.pid})`);
      if (!dryRun) {
        process.kill(daemon.pid, 'SIGTERM');
        const deadline = Date.now() + 30_000;
        while (isAlive(daemon.pid) && Date.now() < deadline) await delay(200);
        if (isAlive(daemon.pid)) process.kill(daemon.pid, 'SIGKILL');
        await removeFile(paths.daemonPid);
      }
    }

    const installation = detectInstallation();
    if (installation === undefined) {
      this.log(
        'This runner was not installed by the install script; its program is left where it is.',
      );
    } else {
      if (
        installation.binLink !== undefined &&
        (await linksInto(installation.binLink, installation.prefix))
      ) {
        say(`remove ${installation.binLink}`);
        if (!dryRun) await rm(installation.binLink, { force: true });
        removed.push(installation.binLink);
      }
      say(`remove ${installation.prefix}`);
      if (!dryRun)
        await rm(installation.prefix, { recursive: true, force: true });
      removed.push(installation.prefix);
    }

    if (flags.purge) {
      for (const dir of [paths.home, paths.workRoot]) {
        if (!existsSync(dir)) continue;
        say(`remove ${dir}`);
        if (!dryRun) await rm(dir, { recursive: true, force: true });
        removed.push(dir);
      }
    } else if (!dryRun) {
      this.log(
        `Kept ${paths.home} (registrations and caches); \`${runnerCommandLine('uninstall', '--purge')}\` removes it too.`,
      );
    }
    this.log(dryRun ? 'Nothing was changed.' : 'The runner is uninstalled.');
    return { removed, dryRun };
  }
}
