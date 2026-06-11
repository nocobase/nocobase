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
import { detectSessionShell, removeSessionIntegration, type SessionShell } from '../../lib/session-integration.js';

export default class SessionRemove extends Command {
  static override summary = 'Remove shell session integration for NB_SESSION_ID';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --shell zsh',
  ];

  static override flags = {
    shell: Flags.string({
      description: 'Target shell to remove configuration from',
      options: ['bash', 'zsh', 'fish', 'powershell', 'cmd'],
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SessionRemove);
    const shell = (flags.shell as SessionShell | undefined) ?? detectSessionShell();
    if (!shell) {
      this.error('Could not detect the current shell. Re-run with `--shell bash|zsh|fish|powershell|cmd`.');
    }

    const result = await removeSessionIntegration(shell);
    this.log(`Session integration removed for ${result.shell}.`);
    if (result.profileUpdated) {
      for (const profileFile of result.profileFiles) {
        this.log(`Profile updated: ${profileFile}`);
      }
    }
    if (result.managedFileRemoved) {
      this.log(`Managed file removed: ${result.managedFile}`);
    }
    if (result.cmdAutoRunRemoved) {
      this.log(`cmd AutoRun updated: ${result.cmdAutoRunLocation}`);
    }
    if (result.agentConfigUpdated) {
      this.log(`Opencode config updated: ${result.agentConfigFile}`);
    }
    if (result.agentPluginRemoved) {
      this.log(`Opencode agent plugin removed: ${result.agentPluginFile}`);
    }
  }
}
