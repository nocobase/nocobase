/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { confirmAction, setVerboseMode } from '../../lib/ui.js';
import {
  formatSelfUpdateUnavailableMessage,
  formatUnsupportedSelfUpdateMessage,
  inspectSelfStatus,
  updateSelf,
  type SelfChannel,
} from '../../lib/self-manager.js';

export default class SelfUpdate extends Command {
  static override summary = 'Update the globally installed NocoBase CLI';
  static override description =
    'Update the current NocoBase CLI install when it is managed by a standard global npm install.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --yes',
    '<%= config.bin %> <%= command.id %> --channel alpha --json',
  ];

  static override flags = {
    channel: Flags.string({
      description: 'Release channel to update to. Defaults to the current CLI channel.',
      options: ['auto', 'latest', 'beta', 'alpha'],
      default: 'auto',
    }),
    yes: Flags.boolean({
      char: 'y',
      description: 'Skip the update confirmation prompt',
      default: false,
    }),
    json: Flags.boolean({
      description: 'Output the result as JSON',
      default: false,
    }),
    verbose: Flags.boolean({
      description: 'Show detailed update output',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SelfUpdate);
    setVerboseMode(flags.verbose);
    const status = await inspectSelfStatus({
      channel: flags.channel as SelfChannel | 'auto',
    });

    if (!status.updatable) {
      this.error(formatUnsupportedSelfUpdateMessage(status));
    }

    if (!status.latestVersion && status.registryError) {
      this.error(formatSelfUpdateUnavailableMessage(status));
    }

    if (!flags.yes && status.updateAvailable) {
      const confirmed = await confirmAction(
        `Update ${status.packageName} from ${status.currentVersion} to ${status.latestVersion}?`,
        { defaultValue: false },
      );
      if (!confirmed) {
        this.log('Skipped CLI update.');
        return;
      }
    }

    const result = await updateSelf({
      channel: flags.channel as SelfChannel | 'auto',
      verbose: flags.verbose,
    });

    if (flags.json) {
      this.log(
        JSON.stringify(
          {
            ok: true,
            kind: 'self',
            action: result.action,
            packageName: result.status.packageName,
            packageSpec: result.packageSpec,
            channel: result.status.channel,
            fromVersion: result.status.currentVersion,
            toVersion: result.targetVersion,
          },
          null,
          2,
        ),
      );
      return;
    }

    if (result.action === 'noop') {
      this.log(
        flags.verbose
          ? `NocoBase CLI is already up to date at ${result.status.currentVersion}.`
          : `NocoBase CLI is up to date: ${result.status.currentVersion}.`,
      );
      return;
    }

    this.log(
      flags.verbose
        ? `Updated NocoBase CLI from ${result.status.currentVersion} using ${result.packageSpec}${result.targetVersion ? ` (latest ${result.status.channel} resolves to ${result.targetVersion})` : ''}.`
        : `Updated NocoBase CLI: ${result.status.currentVersion} -> ${result.targetVersion}.`,
    );
  }
}
