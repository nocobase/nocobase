/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { upsertEnv } from '../../lib/auth-store.js';
import { formatCliHomeScope, type CliHomeScope } from '../../lib/cli-home.js';
import { isInteractiveTerminal, printVerbose, promptText, setVerboseMode } from '../../lib/ui.js';

export default class EnvAdd extends Command {
  static summary = 'Add or update a NocoBase environment';
  static id = 'env add';

  static flags = {
    verbose: Flags.boolean({
      description: 'Show detailed progress output',
      default: false,
    }),
    name: Flags.string({
      description: 'Environment name',
      default: 'default',
    }),
    scope: Flags.string({
      char: 's',
      description: 'Config scope',
      options: ['project', 'global'],
    }),
    'base-url': Flags.string({
      description: 'NocoBase API base URL, for example http://localhost:13000/api',
    }),
    token: Flags.string({
      char: 't',
      description: 'API key',
    }),
    'app-root-path': Flags.string({
      description: 'App root path',
      required: false,
    }),
    'storage-path': Flags.string({
      description: 'storage path',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(EnvAdd);
    setVerboseMode(flags.verbose);
    const name = flags.name || 'default';
    const scope = flags.scope as Exclude<CliHomeScope, 'auto'> | undefined;
    const baseUrl =
      flags['base-url'] ||
      (isInteractiveTerminal()
        ? await promptText('Base URL', { defaultValue: 'http://localhost:13000/api' })
        : '');

    if (Object.keys(flags).includes('token') && !flags.token) {
      flags.token = isInteractiveTerminal() ? await promptText('API key (optional)', { secret: true }) : '';
      if (!flags.token) {
        this.error('API key cannot be empty if --token flag is provided without a value.');
      }
    }

    const token = flags.token;

    if (!baseUrl) {
      this.error('Missing base URL. Pass `--base-url <url>` or run in a TTY to enter it interactively.');
    }

    printVerbose(`Saving env "${name}" with base URL ${baseUrl}`);
    const config = {
      baseUrl,
      accessToken: token,
      appRootPath: flags['app-root-path'],
      storagePath: flags['storage-path'],
    };
    await upsertEnv(name, config, { scope });
    this.log(`Saved env "${name}" and set it as current${scope ? ` in ${formatCliHomeScope(scope)} scope` : ''}.`);
  }
}
