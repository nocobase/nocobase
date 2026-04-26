/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { confirmAction } from '../../lib/ui.js';
import { installNocoBaseSkills } from '../../lib/skills-manager.js';

export default class SkillsInstall extends Command {
  static override summary = 'Install the NocoBase AI coding skills for this workspace';
  static override description =
    'Install the NocoBase AI coding skills for the current workspace. If they are already installed, this command does not update them.';
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
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SkillsInstall);

    if (!flags.yes) {
      const confirmed = await confirmAction(
        'Install the NocoBase AI coding skills for this workspace?',
        { defaultValue: true },
      );
      if (!confirmed) {
        this.log('Skipped skills install.');
        return;
      }
    }

    const result = await installNocoBaseSkills();

    if (flags.json) {
      this.log(
        JSON.stringify(
          {
            ok: true,
            kind: 'skills',
            action: result.action,
            workspaceRoot: result.status.workspaceRoot,
            installedSkillNames: result.status.installedSkillNames,
            installedRef: result.status.installedRef,
          },
          null,
          2,
        ),
      );
      return;
    }

    if (result.action === 'noop') {
      this.log('NocoBase AI coding skills are already installed for this workspace. Run `nb skills update` to refresh them.');
      return;
    }

    this.log('Installed the NocoBase AI coding skills for this workspace.');
  }
}
