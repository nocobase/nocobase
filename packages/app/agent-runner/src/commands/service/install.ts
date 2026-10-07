import { Flags, type Interfaces } from '@oclif/core';

import { RunnerCommand, UsageError } from '../../lib/command.ts';
import {
  readConnections,
  readSettings,
  writeSettings,
} from '../../lib/config.ts';
import { selfCommand } from '../../lib/self.ts';
import { runnerCommandLine } from '../../host.ts';
import { EXIT_CODES } from '../../protocol/index.ts';
import {
  installService,
  SERVICE_LABEL_PATTERN,
  servicePlan,
  type ServicePlan,
} from '../../core/service.ts';

export default class ServiceInstall extends RunnerCommand {
  static override summary: string =
    'Run the runner as a user service that starts at login and restarts when it exits.';
  static override description: string =
    'Writes a launchd agent (macOS) or a systemd user unit (Linux) and (re)starts it. --dry-run prints the file and ' +
    'the commands instead. The label is remembered for `service uninstall` and `uninstall`.';
  static override flags: {
    label: Interfaces.OptionFlag<string | undefined>;
    'dry-run': Interfaces.BooleanFlag<boolean>;
  } = {
    label: Flags.string({
      description:
        'The service label: com.nocobase.runner by default (systemd: nocobase-runner.service, else <label>.service).',
      env: 'NOCOBASE_RUNNER_SERVICE_LABEL',
    }),
    'dry-run': Flags.boolean({
      description: 'Print what would be written and run, and change nothing.',
    }),
  };

  async run(): Promise<ServicePlan & { installed: boolean }> {
    const { flags } = await this.parse(ServiceInstall);
    if ((await readConnections(this.paths)).length === 0) {
      throw new UsageError(
        `This runner is not registered. Run \`${runnerCommandLine('register')}\` first.`,
        EXIT_CODES.auth,
      );
    }
    const settings = await readSettings(this.paths);
    const label = flags.label ?? settings.serviceLabel;
    if (label !== undefined && !SERVICE_LABEL_PATTERN.test(label))
      throw new UsageError(`Not a service label: ${label}`);
    const plan = servicePlan({
      paths: this.paths,
      command: selfCommand(),
      ...(label === undefined ? {} : { label }),
    });
    if (flags['dry-run']) {
      this.log(`# ${plan.file}`);
      this.log(plan.content);
      for (const command of plan.install) this.log(`$ ${command.join(' ')}`);
      return { ...plan, installed: false };
    }
    if (settings.serviceLabel !== plan.label)
      await writeSettings(
        { ...settings, serviceLabel: plan.label },
        this.paths,
      );
    await installService(plan, this.paths);
    this.log(`Installed ${plan.file} and started the service.`);
    return { ...plan, installed: true };
  }
}
