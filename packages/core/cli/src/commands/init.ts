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
import {
  buildEnvAddArgv,
  InitWizardCancelledError,
  runInitBrowserWizard,
} from '../lib/init-browser-wizard.ts';
import { run } from '../lib/run-npm.ts';

export default class Init extends Command {
  static override summary =
    'Initialize the NocoBase AI setup environment';
  static override description = `Initialize the current workspace for NocoBase CLI and agent workflows. You only run nb init; the following runs inside this command (not as separate manual steps):

1. Optionally install NocoBase agent skills (\`npx -y skills add nocobase/skills\`)—you are prompted when using a TTY.
2. If you already have a NocoBase application (anywhere): runs \`nb env add\` only (\`nb install\` is skipped).
3. If not: runs \`nb install\` only (\`nb env add\` is not run afterward; configure the CLI with \`nb env add\` when you need it).

Internal ordering: (skills?) → (already have an app? → env add | install only).

Use \`-y\` / \`--yes\` to skip init prompts (defaults: install skills, then \`nb install\` only—same as choosing the first option, no existing app). When you choose an existing app in a TTY, \`nb env add\` may still prompt for URL and auth.

Use \`--ui\` to open a **browser** wizard (local HTTP server; default bind \`0.0.0.0\`, random port). Use \`--ui-host\` / \`--ui-port\` to override. The opened URL uses \`127.0.0.1\` when the bind address is all-interfaces. It can collect \`nb env add\` fields when you link an existing app, so the terminal env wizard is skipped. Cannot be combined with \`--yes\`.`;

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --ui',
    '<%= config.bin %> <%= command.id %> --ui --ui-host 127.0.0.1 --ui-port 3000',
    '<%= config.bin %> <%= command.id %> -y',
  ];

  static flags = {
    yes: Flags.boolean({
      char: 'y',
      description: 'Skip all prompts',
      default: false,
    }),
    ui: Flags.boolean({
      description:
        'Open a browser-based setup wizard (local HTTP server; not valid with --yes)',
      default: false,
    }),
    'ui-host': Flags.string({
      description:
        'Bind address for the --ui wizard HTTP server (default 0.0.0.0; only with --ui)',
    }),
    'ui-port': Flags.integer({
      description:
        'TCP port for the --ui wizard; 0 = OS-assigned ephemeral port (default 0; only with --ui)',
      min: 0,
      max: 65535,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Init);

    if (flags.ui && flags.yes) {
      this.error('--ui cannot be used with --yes.');
    }

    if (
      !flags.ui &&
      (flags['ui-host'] !== undefined || flags['ui-port'] !== undefined)
    ) {
      this.error('--ui-host and --ui-port require --ui.');
    }

    const interactive = Boolean(stdinStream.isTTY && stdoutStream.isTTY);
    const useBrowserUi = Boolean(flags.ui);

    if (useBrowserUi) {
      if (interactive) {
        p.intro(`${pc.bold('nb init')} ${pc.dim('— browser wizard')}`);
      } else {
        this.log('nb init — browser wizard');
      }
      this.log('Your browser should open; complete the form there to continue.');
    } else {
      p.intro('Initialize the NocoBase AI setup environment');
    }

    /** Whether `nb install` / follow-up should avoid terminal prompts (`-y`). */
    const skipInstallPrompts = Boolean(flags.yes) || !interactive;

    let installSkills = true;
    let hasNocobase = false;
    /** When set, \`nb env add\` is invoked with these argv (from \`--ui\` form). */
    let envAddArgvFromUi: string[] | undefined;

    if (flags.yes) {
      p.log.info('Skipping prompts (--yes): will install NocoBase agent skills.');
      installSkills = true;
      hasNocobase = false;
      p.log.info(
        'Skipping prompts (--yes): will run nb install only (same default as "I don\'t have a NocoBase application yet").',
      );
    } else if (useBrowserUi) {
      try {
        const choice = await runInitBrowserWizard((line) => this.log(line), {
          bindHost: flags['ui-host']?.trim() || '0.0.0.0',
          port: flags['ui-port'] ?? 0,
        });
        installSkills = choice.installSkills;
        hasNocobase = choice.hasNocobase;
        if (choice.envAdd) {
          envAddArgvFromUi = buildEnvAddArgv(choice.envAdd);
        }
      } catch (error: unknown) {
        if (error instanceof InitWizardCancelledError) {
          if (interactive) {
            p.cancel(error.message);
          } else {
            this.log(error.message);
          }
          this.exit(0);
        }
        throw error;
      }
    } else if (interactive) {
      const skillsAnswer = await p.confirm({
        message: 'Install NocoBase agent skills (nocobase/skills) for Cursor / Codex workflows?',
        initialValue: true,
      });
      if (p.isCancel(skillsAnswer)) {
        p.cancel('Init cancelled.');
        this.exit(0);
      }
      installSkills = skillsAnswer;

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
    } else {
      p.log.warn(
        'Non-interactive terminal: will install NocoBase agent skills (skip is not available without a TTY).',
      );
      installSkills = true;
      hasNocobase = false;
      p.log.warn(
        'Non-interactive terminal: assuming you do not already have a NocoBase app (will run nb install only).',
      );
    }

    if (installSkills) {
      try {
        p.log.step('Installing NocoBase agent skills (npx -y skills add nocobase/skills)');
        await run('npx', ['-y', 'skills', 'add', 'nocobase/skills', '-y'], process.cwd());
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        p.outro(pc.red(`Skills install failed: ${message}`));
        this.error(message);
      }
    } else {
      p.log.info('Skipped NocoBase agent skills install.');
    }

    try {
      // oclif explicit registry keys use `:` (e.g. `env:add`); users still type `nb env add`.
      if (hasNocobase) {
        p.log.step('Running nb env add');
        if (useBrowserUi && !envAddArgvFromUi) {
          this.error('Browser wizard did not supply env add options.');
        }
        const envArgv =
          envAddArgvFromUi ??
          (interactive ? ['--scope', 'project'] : ['default', '--scope', 'project']);
        await this.config.runCommand('env:add', envArgv);
      } else {
        p.log.step('Running nb install');
        await this.config.runCommand(
          'install',
          skipInstallPrompts ? ['-e', 'local', '-y'] : [],
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
