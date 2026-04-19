/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { stdin as stdinStream, stdout as stdoutStream } from 'node:process';
import { run } from '../lib/run-npm.ts';

export default class Init extends Command {
  static override summary =
    'Initialize the workspace: skills install, then either nb env add or nb install—entire flow runs inside nb init';
  static override description = `Initialize the current workspace for NocoBase CLI and agent workflows. You only run nb init; the following runs inside this command (not as separate manual steps):

1. Optionally install NocoBase agent skills (\`npx -y skills add nocobase/skills\`)—you are prompted when using a TTY.
2. If you already have a NocoBase application (anywhere): runs \`nb env add\` only (\`nb install\` is skipped).
3. If not: runs \`nb install\` only (\`nb env add\` is not run afterward; configure the CLI with \`nb env add\` when you need it).

Internal ordering: (skills?) → (already have an app? → env add | install only).

Use \`-y\` / \`--yes\` to skip init prompts (defaults: install skills, then \`nb install\` only—same as choosing the first option, no existing app). When you choose an existing app in a TTY, \`nb env add\` may still prompt for URL and auth.`;

  static override examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> <%= command.id %> -y'];

  static flags = {
    yes: Flags.boolean({
      char: 'y',
      description: 'Skip all prompts',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Init);
    p.intro('nb init');

    const interactive = Boolean(stdinStream.isTTY && stdoutStream.isTTY);
    const skipPrompts = Boolean(flags.yes) || !interactive;

    let installSkills = true;
    if (skipPrompts) {
      if (flags.yes) {
        p.log.info('Skipping prompts (--yes): will install NocoBase agent skills.');
      } else {
        p.log.warn(
          'Non-interactive terminal: will install NocoBase agent skills (skip is not available without a TTY).',
        );
      }
      installSkills = true;
    } else {
      const skillsAnswer = await p.confirm({
        message: 'Install NocoBase agent skills (nocobase/skills) for Cursor / Codex workflows?',
        initialValue: true,
      });
      if (p.isCancel(skillsAnswer)) {
        p.cancel('Init cancelled.');
        this.exit(0);
      }
      installSkills = skillsAnswer;
    }

    if (installSkills) {
      try {
        p.log.step('Installing NocoBase agent skills (npx -y skills add nocobase/skills)');
        await run('npx', ['-y', 'skills', 'add', 'nocobase/skills' , '-y'], process.cwd());
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        p.outro(pc.red(`Skills install failed: ${message}`));
        this.error(message);
      }
    } else {
      p.log.info('Skipped NocoBase agent skills install.');
    }

    let hasNocobase: boolean;
    if (skipPrompts) {
      hasNocobase = false;
      if (interactive && flags.yes) {
        p.log.info(
          'Skipping prompts (--yes): will run nb install only (same default as "I don\'t have a NocoBase application yet").',
        );
      } else if (!interactive) {
        p.log.warn(
          'Non-interactive terminal: assuming you do not already have a NocoBase app (will run nb install only).',
        );
      }
    } else {
      const answer = await p.select<'yes' | 'no'>({
        message: 'Do you already have a NocoBase application?',
        options: [
          {
            value: 'no',
            label: "I don't have a NocoBase application yet",
          },
          {
            value: 'yes',
            label: 'I already have a NocoBase application',
          },
        ],
        initialValue: 'no',
      });
      if (p.isCancel(answer)) {
        p.cancel('Init cancelled.');
        this.exit(0);
      }
      hasNocobase = answer === 'yes';
    }

    try {
      // oclif explicit registry keys use `:` (e.g. `env:add`); users still type `nb env add`.
      if (hasNocobase) {
        p.log.step('Running nb env add');
        await this.config.runCommand(
          'env:add',
          interactive ? ['--scope', 'project'] : ['default', '--scope', 'project'],
        );
      } else {
        p.log.step('Running nb install');
        await this.config.runCommand(
          'install',
          skipPrompts ? ['-e', 'local', '-y'] : [],
        );
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      p.outro(pc.red(message));
      this.error(message);
    }

    p.outro('Workspace init finished.');
  }
}
