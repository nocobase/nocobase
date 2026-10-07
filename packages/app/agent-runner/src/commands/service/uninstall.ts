import { Flags, type Interfaces } from '@oclif/core';

import { RunnerCommand } from '../../lib/command.ts';
import { readSettings } from '../../lib/config.ts';
import { selfCommand } from '../../lib/self.ts';
import {
  servicePlan,
  uninstallService,
  type ServicePlan,
} from '../../core/service.ts';

export default class ServiceUninstall extends RunnerCommand {
  static override summary: string =
    'Stop the runner service and remove its definition.';
  static override flags: {
    label: Interfaces.OptionFlag<string | undefined>;
    'dry-run': Interfaces.BooleanFlag<boolean>;
  } = {
    label: Flags.string({
      description:
        'The service label; the one `service install` used by default.',
      env: 'NOCOBASE_RUNNER_SERVICE_LABEL',
    }),
    'dry-run': Flags.boolean({
      description: 'Print what would be run and removed, and change nothing.',
    }),
  };

  async run(): Promise<ServicePlan & { uninstalled: boolean }> {
    const { flags } = await this.parse(ServiceUninstall);
    const label = flags.label ?? (await readSettings(this.paths)).serviceLabel;
    const plan = servicePlan({
      paths: this.paths,
      command: selfCommand(),
      ...(label === undefined ? {} : { label }),
    });
    if (flags['dry-run']) {
      for (const command of plan.uninstall) this.log(`$ ${command.join(' ')}`);
      this.log(`$ rm ${plan.file}`);
      return { ...plan, uninstalled: false };
    }
    await uninstallService(plan);
    this.log(`Removed ${plan.file}.`);
    return { ...plan, uninstalled: true };
  }
}
