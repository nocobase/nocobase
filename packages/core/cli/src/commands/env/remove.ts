/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as p from '@clack/prompts';
import { Args, Command, Flags } from '@oclif/core';
import { getCurrentEnvName, loadAuthConfig, removeEnv } from '../../lib/auth-store.js';
import { resolveDefaultConfigScope } from '../../lib/cli-home.js';
import { isInteractiveTerminal, printVerbose, setVerboseMode } from '../../lib/ui.js';

export default class EnvRemove extends Command {
  static override summary = 'Remove a configured environment';
  static override description =
    'Remove the saved CLI env config for an environment. This command does not clean local app files, containers, or storage data.';

  static override examples = [
    '<%= config.bin %> <%= command.id %> staging',
    '<%= config.bin %> <%= command.id %> staging --yes',
  ];

  static override flags = {
    yes: Flags.boolean({
      char: 'y',
      description: 'Skip confirmation and remove the saved CLI env config',
      default: false,
    }),
    force: Flags.boolean({
      char: 'f',
      hidden: true,
      default: false,
    }),
    verbose: Flags.boolean({
      description: 'Show detailed progress output',
      default: false,
    }),
  };

  static override args = {
    name: Args.string({
      description: 'Configured environment name to remove',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(EnvRemove);
    setVerboseMode(flags.verbose);
    const scope = resolveDefaultConfigScope();
    const config = await loadAuthConfig({ scope });
    if (!config.envs[args.name]) {
      this.error(`Env "${args.name}" is not configured`);
    }
    const currentEnv = await getCurrentEnvName({ scope });
    const skipConfirmation = flags.yes || flags.force;

    if (!skipConfirmation) {
      if (!isInteractiveTerminal()) {
        this.error(
          `Refusing to remove env "${args.name}" without confirmation in non-interactive mode. Re-run with \`--yes\` to remove only the saved CLI env config.`,
        );
      }

      const subject = args.name === currentEnv ? `current env "${args.name}"` : `env "${args.name}"`;
      const confirmed = await p.confirm({
        message: `Remove ${subject}? This only removes the saved CLI env config. It does not clean local app files, containers, or storage data.`,
        active: 'Yes',
        inactive: 'No',
        initialValue: false,
      });
      if (p.isCancel(confirmed)) {
        p.cancel('Canceled.');
        return;
      }
      if (!confirmed) {
        this.log('Canceled.');
        return;
      }
    }

    printVerbose(`Removing env "${args.name}"`);
    const result = await removeEnv(args.name, { scope });

    this.log(`Removed env "${result.removed}".`);

    if (result.hasEnvs) {
      this.log(`Current env: ${await getCurrentEnvName({ scope })}`);
      return;
    }

    this.log('No envs configured.');
  }
}
