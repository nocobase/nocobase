import { Flags, type Interfaces } from '@oclif/core';

import { RunnerCommand } from '../../lib/command.ts';
import { restartService } from '../../core/service.ts';

/** An independent launchd job reloads its parent's migrated plist after that parent exits. */
export default class ServiceRestart extends RunnerCommand {
  static override hidden = true;
  static override flags: { label: Interfaces.OptionFlag<string> } = {
    label: Flags.string({ required: true }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ServiceRestart);
    await restartService(flags.label);
  }
}
