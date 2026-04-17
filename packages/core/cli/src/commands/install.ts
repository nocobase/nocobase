/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { runNpm } from '../lib/run-npm.ts';

export default class Install extends Command {
  static override description = 'Run the legacy NocoBase install (forwards to `npm run install` in the repo root)';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> -f',
    '<%= config.bin %> <%= command.id %> -l zh-CN',
    '<%= config.bin %> <%= command.id %> -m demo@nocobase.com',
    '<%= config.bin %> <%= command.id %> -p admin123',
    '<%= config.bin %> <%= command.id %> -n "Super Admin"',
  ];
  static override flags = {
    env: Flags.string({ description: 'Environment', char: 'e', required: false }),
    force: Flags.boolean({ description: 'Reinstall the application by clearing the database', char: 'f', required: false }),
    lang: Flags.string({ description: 'Language during installation', char: 'l', required: false }),
    rootEmail: Flags.string({ description: 'Root user email', char: 'm', required: false }),
    rootPassword: Flags.string({ description: 'Root user password', char: 'p', required: false }),
    rootNickname: Flags.string({ description: 'Root user nickname', char: 'n', required: false }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Install);
    const forwarded: string[] = [];
    if (flags.env !== undefined) {
      forwarded.push('-e', flags.env);
    }
    if (flags.force) {
      forwarded.push('-f');
    }
    if (flags.lang !== undefined) {
      forwarded.push('-l', flags.lang);
    }
    if (flags.rootEmail !== undefined) {
      forwarded.push('-m', flags.rootEmail);
    }
    if (flags.rootPassword !== undefined) {
      forwarded.push('-p', flags.rootPassword);
    }
    if (flags.rootNickname !== undefined) {
      forwarded.push('-n', flags.rootNickname);
    }

    const npmArgs = ['nocobase', 'install'];
    if (forwarded.length > 0) {
      npmArgs.push('--', ...forwarded);
    }

    try {
      await runNpm(process.cwd(), npmArgs);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(
        [
          'Failed to run `npm run install`.',
          'Run from the NocoBase repo root and ensure a package script named `install` is defined (e.g. `nocobase-v1 install`), or invoke the legacy CLI directly.',
          message,
        ].join('\n'),
        { exit: 1 },
      );
    }
  }
}
