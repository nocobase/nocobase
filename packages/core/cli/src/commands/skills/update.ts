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
import { updateNocoBaseSkills } from '../../lib/skills-manager.js';

export default class SkillsUpdate extends Command {
  static override summary = 'Update the NocoBase AI coding skills for this workspace';
  static override description =
    'Refresh the NocoBase AI coding skills for the current workspace. This command only updates an existing nocobase/skills install.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --yes',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static override flags = {
    yes: Flags.boolean({
      char: 'y',
      description: 'Skip the update confirmation prompt',
      default: false,
    }),
    json: Flags.boolean({
      description: 'Output the result as JSON',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SkillsUpdate);

    if (!flags.yes) {
      const confirmed = await confirmAction(
        'Update the NocoBase AI coding skills for this workspace?',
        { defaultValue: true },
      );
      if (!confirmed) {
        this.log('Skipped skills update.');
        return;
      }
    }

    const result = await updateNocoBaseSkills();

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
      this.log('NocoBase AI coding skills are already up to date for this workspace.');
      return;
    }

    this.log('Updated the NocoBase AI coding skills for this workspace.');
  }
}
