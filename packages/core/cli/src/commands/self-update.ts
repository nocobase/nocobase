/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command } from '@oclif/core';
import { spawn } from 'node:child_process';

function runNpmInstallGlobal(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['install', '-g', ...args], {
      stdio: 'inherit',
      shell: true,
      env: process.env,
    });
    child.once('error', reject);
    child.once('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`npm exited with code ${code}`));
    });
  });
}

export default class SelfUpdate extends Command {
  static override description = 'Update the NocoBase CLI to the latest version';
  static override examples = ['<%= config.bin %> <%= command.id %>'];

  public async run(): Promise<void> {
    this.log('Updating NocoBase CLI to the latest version...');
    try {
      await runNpmInstallGlobal(['@nocobase/cli']);
      this.log('Update finished.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(
        [
          'Failed to update the CLI.',
          'Try running manually: npm install -g @nocobase/cli',
          message,
        ].join('\n'),
        { exit: 1 },
      );
    }
  }
}
