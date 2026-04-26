/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import {
  getRecommendedSelfUpdateCommand,
  inspectSelfStatus,
  type SelfChannel,
} from '../../lib/self-manager.js';
import { printInfo, renderTable } from '../../lib/ui.js';

export default class SelfCheck extends Command {
  static override summary = 'Check the installed NocoBase CLI version and self-update support';
  static override description =
    'Inspect the current NocoBase CLI install, resolve the latest version for the selected channel, and report whether automatic self-update is supported.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --channel beta',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static override flags = {
    channel: Flags.string({
      description: 'Release channel to compare against. Defaults to the current CLI channel.',
      options: ['auto', 'latest', 'beta', 'alpha'],
      default: 'auto',
    }),
    json: Flags.boolean({
      description: 'Output the result as JSON',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SelfCheck);
    const status = await inspectSelfStatus({
      channel: flags.channel as SelfChannel | 'auto',
    });

    if (flags.json) {
      this.log(
        JSON.stringify(
          {
            ok: true,
            kind: 'self',
            packageName: status.packageName,
            currentVersion: status.currentVersion,
            latestVersion: status.latestVersion,
            channel: status.channel,
            updateAvailable: status.updateAvailable,
            installMethod: status.installMethod,
            updatable: status.updatable,
            updateBlockedReason: status.updateBlockedReason,
            recommendedCommand: getRecommendedSelfUpdateCommand(status),
            registryError: status.registryError,
          },
          null,
          2,
        ),
      );
      return;
    }

    this.log(
      renderTable(
        ['Field', 'Value'],
        [
          ['Current version', status.currentVersion || 'unknown'],
          ['Latest version', status.latestVersion || 'unknown'],
          ['Channel', status.channel],
          ['Install method', status.installMethod],
          ['Auto-update', status.updatable ? 'supported' : 'not supported'],
          ['Update available', status.updateAvailable ? 'yes' : 'no'],
        ],
      ),
    );

    if (status.updateAvailable && status.updatable) {
      printInfo('Run `nb self update` to update the CLI.');
    } else if (status.updateAvailable && status.updateBlockedReason) {
      printInfo(status.updateBlockedReason);
    }

    if (status.registryError) {
      printInfo(`Version check warning: ${status.registryError}`);
    }
  }
}
