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
import { removeNocoBaseSkills } from '../../lib/skills-manager.js';

export default class SkillsRemove extends Command {
  static override summary = 'Remove the globally installed NocoBase AI coding skills';
  static override description =
    'Remove the skills installed from nocobase/skills globally. This only removes the skills managed by `nb`.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --yes',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static override flags = {
    yes: Flags.boolean({
      char: 'y',
      description: 'Skip the remove confirmation prompt',
      default: false,
    }),
    json: Flags.boolean({
      description: 'Output the result as JSON',
      default: false,
    }),
    verbose: Flags.boolean({
      description: 'Show detailed remove output',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SkillsRemove);
    setVerboseMode(flags.verbose);

    if (!flags.yes) {
      const confirmed = await confirmAction(
        'Remove the globally installed NocoBase AI coding skills?',
        { defaultValue: true },
      );
      if (!confirmed) {
        this.log('Skipped skills removal.');
        return;
      }
    }

    const result = await removeNocoBaseSkills({
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
          ? 'NocoBase AI coding skills are not installed globally.'
          : 'NocoBase AI coding skills are not installed.',
      );
      return;
    }

    this.log(
      flags.verbose
        ? 'Removed the global NocoBase AI coding skills.'
        : 'Removed NocoBase AI coding skills globally.',
    );
  }
}
