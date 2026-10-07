import { Flags, type Interfaces } from '@oclif/core';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { RunnerCommand, UsageError } from '../lib/command.ts';
import {
  normalizeServer,
  readConnections,
  readSettings,
  runnerClient,
  writeSettings,
} from '../lib/config.ts';
import { detectInstallation, launcherOf } from '../lib/install.ts';
import { EXIT_CODES } from '../protocol/index.ts';
import { readDaemonPid, runnerVersion } from '../core/loop.ts';
import { runnerCommandLine, runnerHost } from '../host.ts';
import { applyUpdate, isNewer, latestRunner } from '../core/update.ts';

const run = promisify(execFile);

interface UpdateResult {
  current: string;
  latest?: string;
  updated: boolean;
  autoUpdate: boolean;
}

export default class Update extends RunnerCommand {
  static override summary: string =
    'Update the runner to the version the application serves.';
  static override description: string =
    'Asks the application this runner is registered with (the first one, or --server) for the runner it serves for ' +
    'this platform, installs it beside the running version and restarts the runner on it. A runner installed by the ' +
    'install script also does this on its own between runs, unless --auto off.';
  static override flags: {
    server: Interfaces.OptionFlag<string | undefined>;
    check: Interfaces.BooleanFlag<boolean>;
    auto: Interfaces.OptionFlag<string | undefined>;
  } = {
    server: Flags.string({
      description:
        'The application to update from, when the runner is registered with several.',
    }),
    check: Flags.boolean({
      description: 'Only say whether a newer version is served.',
    }),
    auto: Flags.string({
      description: 'Turn updating on its own between runs on or off.',
      options: ['on', 'off'],
    }),
  };

  async run(): Promise<UpdateResult> {
    const { flags } = await this.parse(Update);
    const settings = await readSettings(this.paths);
    if (flags.auto !== undefined) {
      settings.autoUpdate = flags.auto === 'on';
      await writeSettings(settings, this.paths);
      this.log(
        `Updating on its own is ${settings.autoUpdate ? 'on' : 'off'}; it takes effect when the runner restarts.`,
      );
      if (!flags.check && flags.server === undefined)
        return {
          current: runnerVersion(),
          updated: false,
          autoUpdate: settings.autoUpdate,
        };
    }
    const connections = await readConnections(this.paths);
    const server =
      flags.server === undefined ? undefined : normalizeServer(flags.server);
    const connection =
      server === undefined
        ? connections[0]
        : connections.find((item) => item.registration.server === server);
    if (connection === undefined)
      throw new UsageError(
        server === undefined
          ? `This runner is not registered. Run \`${runnerCommandLine('register')}\` first.`
          : `Not registered with ${server}.`,
        EXIT_CODES.notFound,
      );
    const client = runnerClient(connection);
    const latest = await latestRunner(client);
    const result: UpdateResult = {
      current: runnerVersion(),
      latest: latest.version,
      updated: false,
      autoUpdate: settings.autoUpdate,
    };
    if (!isNewer(latest.version, runnerVersion())) {
      this.log(
        `${runnerHost().bin} ${runnerVersion()} is up to date (${connection.registration.server} serves ${latest.version}).`,
      );
      return result;
    }
    if (flags.check) {
      this.log(
        `${runnerHost().bin} ${latest.version} is available (this is ${runnerVersion()}). Run \`${runnerCommandLine('update')}\`.`,
      );
      return result;
    }
    const installation = detectInstallation();
    if (installation === undefined)
      throw new UsageError(
        'This runner was not installed by the install script, so it cannot replace itself. Run the install command ' +
          'from "Add runtime" again, or update it the way it was installed.',
      );
    await applyUpdate({
      installation,
      client,
      update: {
        version: latest.version,
        url: latest.url,
        sha256: latest.sha256,
      },
      log: (message) => this.log(message),
    });
    result.updated = true;
    // Restart on the new version: the service starts it again by itself once the daemon stops; a background daemon
    // started by hand is started again here.
    if ((await readDaemonPid(this.paths)) !== undefined) {
      const launcher = launcherOf(installation);
      await run(launcher, ['stop']);
      if (settings.serviceLabel === undefined) await run(launcher, ['start']);
      this.log(`Restarted the runner on ${latest.version}.`);
    }
    this.log(
      `Updated ${runnerHost().bin} ${runnerVersion()} → ${latest.version}.`,
    );
    return result;
  }
}
