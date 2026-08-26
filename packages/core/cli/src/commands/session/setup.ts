/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { detectSessionShell, setupSessionIntegration, type SessionShell } from '../../lib/session-integration.js';

export default class SessionSetup extends Command {
  static override summary = 'Set up shell session integration for NB_SESSION_ID';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --shell zsh',
    '<%= config.bin %> <%= command.id %> --shell powershell',
  ];

  static override flags = {
    shell: Flags.string({
      description: 'Target shell to configure',
      options: ['bash', 'zsh', 'fish', 'powershell', 'cmd'],
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SessionSetup);
    const shell = (flags.shell as SessionShell | undefined) ?? detectSessionShell();
    if (!shell) {
      this.error('Could not detect the current shell. Re-run with `--shell bash|zsh|fish|powershell|cmd`.');
    }

    const result = await setupSessionIntegration(shell);
    this.log(`Session integration configured for ${result.shell}.`);
    this.log(`Managed file: ${result.managedFile}`);
    if (result.cmdAutoRunConfigured) {
      this.log(`cmd AutoRun updated: ${result.cmdAutoRunLocation}`);
      this.log('Open a new cmd session to initialize NB_SESSION_ID automatically.');
    }
    if (result.agentConfigured) {
      this.log(`Opencode agent plugin installed: ${result.agentPluginFile}`);
      this.log(`Opencode config updated: ${result.agentConfigFile}`);
    } else if (result.agentSkippedReason === 'opencode_dir_not_found') {
      this.log('Opencode config directory not found. Skipped agent session integration.');
    }
    if (result.profileFiles.length > 0) {
      for (const profileFile of result.profileFiles) {
        this.log(`Profile updated: ${profileFile}`);
      }
      this.log('Open a new shell session or reload your profile to initialize NB_SESSION_ID automatically.');
    }
    if (result.manualStep) {
      this.log(result.manualStep);
    }
  }
}
