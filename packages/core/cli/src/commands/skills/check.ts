/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { inspectSkillsStatus } from '../../lib/skills-manager.js';
import { printInfo, renderTable } from '../../lib/ui.js';

export default class SkillsCheck extends Command {
  static override summary = 'Check the globally installed NocoBase AI coding skills';
  static override description =
    'Inspect the global NocoBase AI coding skills and report whether they are managed by the CLI and whether an update is available.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static override flags = {
    json: Flags.boolean({
      description: 'Output the result as JSON',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SkillsCheck);
    const status = await inspectSkillsStatus();

    if (flags.json) {
      this.log(
        JSON.stringify(
          {
            ok: true,
            kind: 'skills',
            globalRoot: status.globalRoot,
            workspaceRoot: status.workspaceRoot,
            installed: status.installed,
            managedByNb: status.managedByNb,
            sourcePackage: status.sourcePackage,
            npmPackageName: status.npmPackageName,
            installedSkillNames: status.installedSkillNames,
            installedVersion: status.installedVersion,
            latestVersion: status.latestVersion,
            installedRef: status.installedRef,
            latestRef: status.latestRef,
            updateAvailable: status.updateAvailable,
            recommendedCommand: status.installed ? 'nb skills update --yes' : 'nb skills install --yes',
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
          ['Skills home', status.globalRoot],
          ['Installed', status.installed ? 'yes' : 'no'],
          ['Managed by nb', status.managedByNb ? 'yes' : 'no'],
          ['Installed skills', status.installedSkillNames.length ? status.installedSkillNames.join(', ') : '(none)'],
          ['Installed version', status.installedVersion ?? '(unknown)'],
          ['Latest version', status.latestVersion ?? '(unknown)'],
          ['Update available', status.updateAvailable === null ? 'unknown' : status.updateAvailable ? 'yes' : 'no'],
        ],
      ),
    );

    if (!status.installed) {
      printInfo('Run `nb skills install` to install the NocoBase AI coding skills globally.');
      return;
    }

    if (status.updateAvailable) {
      printInfo('Run `nb skills update` to refresh the global NocoBase AI coding skills.');
    }

    if (status.registryError) {
      printInfo(`Update check warning: ${status.registryError}`);
    }
  }
}
