/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core';
import { upsertEnv } from '../../lib/auth-store.js';
import { type CliHomeScope } from '../../lib/cli-home.js';
import {
  runPromptCatalog,
  type PromptInitialValues,
  type PromptsCatalog,
} from '../../lib/prompt-catalog.js';
import { setVerboseMode } from '../../lib/ui.js';

type EnvScope = Exclude<CliHomeScope, 'auto'>;

export default class EnvAdd extends Command {
  static override summary =
    'Save a named NocoBase API endpoint (token or OAuth), then switch the CLI to use it';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> local',
    '<%= config.bin %> <%= command.id %> local --scope project --api-base-url http://localhost:13000/api --auth-type oauth',
  ];

  static override args = {
    name: Args.string({
      description:
        'Label for this environment (optional first argument; in a TTY, prompted when omitted; required when not using a TTY)',
      required: false,
    }),
  };

  static override flags = {
    env: Flags.string({
      char: 'e',
      hidden: true,
      deprecated: true,
      description:
        'Environment name (same as the optional positional argument; for compatibility with -e/--env on other commands)',
    }),
    verbose: Flags.boolean({
      description: 'Print detailed progress while writing config',
      default: false,
    }),
    scope: Flags.string({
      char: 's',
      description:
        'Where to store env config: project (.nocobase in the repo) or global (user-level); prompted in a TTY when omitted',
      options: ['project', 'global'],
      default: 'project',
    }),
    'default-api-base-url': Flags.string({
      char: 'd',
      hidden: true,
      description:
        'Default API base URL for HTTP API calls, including the /api prefix (e.g. http://localhost:13000/api); prompted in a TTY when omitted',
    }),
    'api-base-url': Flags.string({
      char: 'u',
      aliases: ['base-url'],
      description:
        'Root URL for HTTP API calls, including the /api prefix (e.g. http://localhost:13000/api); prompted in a TTY when omitted',
    }),
    'auth-type': Flags.string({
      char: 'a',
      description:
        'Authentication: token (API key) or oauth (browser login via `nb env auth`); prompted in a TTY when omitted',
      options: ['token', 'oauth'],
    }),
    'access-token': Flags.string({
      char: 't',
      aliases: ['token'],
      description:
        'API key or access token when using --auth-type token (prompted in a TTY when omitted)',
    }),
  };

  static prompts: PromptsCatalog = {
    intro: {
      type: 'intro',
      title: 'Add NocoBase API endpoint',
    },
    name: {
      type: 'text',
      message: 'Environment name',
      placeholder: 'default',
      required: true,
    },
    scope: {
      type: 'select',
      message: 'Where should this env be stored?',
      options: [
        { value: 'project', label: 'Project', hint: '.nocobase in this repo' },
        { value: 'global', label: 'Global', hint: 'user-level config' },
      ],
      initialValue: 'project',
      required: true,
    },
    apiBaseUrl: {
      type: 'text',
      message: 'API base URL',
      placeholder: 'http://localhost:13000/api',
      initialValue: 'http://localhost:13000/api',
      required: true,
    },
    authType: {
      type: 'select',
      message: 'How do you want to authenticate?',
      options: [
        { value: 'oauth', label: 'OAuth (browser login)', hint: 'runs nb env auth after save' },
        { value: 'token', label: 'API token / API key' },
      ],
      initialValue: 'oauth',
      required: true,
    },
    accessToken: {
      type: 'text',
      message: 'API token / API key',
      placeholder: 'Enter your API token / API key',
      required: true,
      hidden: (values) => values.authType !== 'token',
    },
    upsertEnv: {
      type: 'run',
      run: async (values) => {
        await upsertEnv(
          String(values.name),
          {
            baseUrl: String(values.apiBaseUrl),
            ...(values.authType === 'token' && values.accessToken != null
              ? { accessToken: String(values.accessToken) }
              : {}),
          },
          { scope: values.scope as EnvScope },
        );
      },
    },
    oauthLogin: {
      type: 'run',
      when: (values) => values.authType === 'oauth',
      run: async (values, command) => {
        const cmd = command as EnvAdd;
        const argv = [String(values.name)];
        if (values.scope !== undefined && values.scope !== '') {
          argv.push('-s', String(values.scope));
        }
        await cmd.config.runCommand('env:auth', argv);
      },
    },
    loadCommands: {
      type: 'run',
      run: async (values, command) => {
        const cmd = command as EnvAdd;
        await cmd.config.runCommand('env:update', [String(values.name)]);
      },
    },
    outro: {
      type: 'outro',
      message: 'Prompts complete — finishing setup.',
    },
  };

  private buildValues(
    nameArg: string | undefined,
    flags: {
      env?: string;
      scope?: string;
      'default-api-base-url'?: string;
      'api-base-url'?: string;
      'base-url'?: string;
      'auth-type'?: string;
      'access-token'?: string;
      token?: string;
    },
  ): PromptInitialValues {
    const iv: PromptInitialValues = {};
    const name = nameArg?.trim() || flags.env?.trim();
    if (name) {
      iv.name = name;
    }
    if (flags.scope) {
      iv.scope = flags.scope;
    }
    const apiFromFlag = flags['api-base-url'] ?? flags['base-url'];
    if (typeof apiFromFlag === 'string' && apiFromFlag.trim() !== '') {
      iv.apiBaseUrl = apiFromFlag.trim();
    }
    if (flags['auth-type']) {
      iv.authType = flags['auth-type'];
    }
    const token = flags['access-token'] ?? flags.token;
    if (typeof token === 'string' && token !== '') {
      iv.accessToken = token;
    }
    return iv;
  }

  runPromptCatalog({ initialValues, values }) {
    return runPromptCatalog(EnvAdd.prompts, {
      initialValues,
      values,
      command: this,
    });
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(EnvAdd);
    setVerboseMode(flags.verbose);
    await this.runPromptCatalog({
      values: this.buildValues(args.name, flags),
      initialValues: {
        apiBaseUrl: flags['default-api-base-url'],
      },
    });
  }
}
