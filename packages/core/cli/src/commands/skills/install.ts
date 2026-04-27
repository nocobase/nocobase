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
import { installNocoBaseSkills } from '../../lib/skills-manager.js';

export default class SkillsInstall extends Command {
  static override summary = 'Install the NocoBase AI coding skills globally';
  static override description =
    'Install the NocoBase AI coding skills globally. If they are already installed, this command does not update them.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --yes',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static override flags = {
    yes: Flags.boolean({
      char: 'y',
      description: 'Skip the install confirmation prompt',
      default: false,
    }),
    json: Flags.boolean({
      description: 'Output the result as JSON',
      default: false,
    }),
    verbose: Flags.boolean({
      description: 'Show detailed install output',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SkillsInstall);
    setVerboseMode(flags.verbose);

    if (!flags.yes) {
      const confirmed = await confirmAction(
        'Install the NocoBase AI coding skills globally?',
        { defaultValue: true },
      );
      if (!confirmed) {
        this.log('Skipped skills install.');
        return;
      }
    }

    const result = await installNocoBaseSkills({
      verbose: flags.verbose,
    });

    if (flags.json) {
      this.log(
        JSON.stringify(
          {
            ok: true,
            kind: 'skills',
            action: result.action,
            globalRoot: result.status.globalRoot,
            workspaceRoot: result.status.workspaceRoot,
            installedSkillNames: result.status.installedSkillNames,
            installedVersion: result.status.installedVersion,
            installedRef: result.status.installedRef,
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
          ? 'NocoBase AI coding skills are already installed globally. Run `nb skills update` to refresh them.'
          : 'NocoBase AI coding skills are already installed globally.',
      );
      return;
    }

    this.log(
      flags.verbose
        ? 'Installed the NocoBase AI coding skills globally.'
        : 'Installed NocoBase AI coding skills globally.',
    );
  }
}
