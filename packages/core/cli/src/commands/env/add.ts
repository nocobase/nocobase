/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core';
import * as p from '@clack/prompts';
import { upsertEnv } from '../../lib/auth-store.js';
import { formatCliHomeScope, type CliHomeScope } from '../../lib/cli-home.js';
import { isInteractiveTerminal, printVerbose, setVerboseMode } from '../../lib/ui.js';

type AuthType = 'token' | 'oauth';
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

  private exitCancelled(): never {
    p.cancel('Cancelled.');
    this.exit(0);
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(EnvAdd);
    setVerboseMode(flags.verbose);

    const nameArg = args.name?.trim();
    const nameFlag = flags.env?.trim() || undefined;
    if (nameArg && nameFlag && nameArg !== nameFlag) {
      this.error(
        `Environment name was given both as the argument ("${nameArg}") and as --env ("${nameFlag}"); use only one.`,
      );
    }
    let name = nameArg || nameFlag || undefined;
    let scope = flags.scope as EnvScope | undefined;
    let baseUrl = flags['api-base-url'] ?? flags['base-url'];
    let defaultApiBaseUrl = flags['default-api-base-url'] ?? 'http://localhost:13000/api';
    let authType = flags['auth-type'] as AuthType | undefined;

    const interactive = isInteractiveTerminal();

    if (!interactive) {
      const missing: string[] = [];
      if (!name?.trim()) {
        missing.push('<name> (first argument or --env)');
      }
      if (!scope) {
        missing.push('--scope');
      }
      if (!baseUrl) {
        missing.push('--api-base-url');
      }
      if (!authType) {
        missing.push('--auth-type');
      }
      if (missing.length > 0) {
        this.error(
          `Non-interactive mode requires: ${missing.join(', ')}. Example: nb env add -e local --scope project --api-base-url http://localhost:13000/api --auth-type oauth`,
        );
      }
    } else {
      if (!name?.trim()) {
        const answer = await p.text({
          message: 'Environment name',
          placeholder: 'default',
          defaultValue: 'default',
        });
        if (p.isCancel(answer)) {
          this.exitCancelled();
        }
        name = answer;
      }

      if (!scope) {
        const answer = await p.select<EnvScope>({
          message: 'Where should this env be stored?',
          options: [
            { value: 'project', label: 'Project', hint: '.nocobase in this repo' },
            { value: 'global', label: 'Global', hint: 'user-level config' },
          ],
          initialValue: 'project',
        });
        if (p.isCancel(answer)) {
          this.exitCancelled();
        }
        scope = answer;
      }

      if (!baseUrl) {
        const answer = await p.text({
          message: 'API base URL',
          placeholder: defaultApiBaseUrl,
          initialValue: defaultApiBaseUrl,
        });
        if (p.isCancel(answer)) {
          this.exitCancelled();
        }
        baseUrl = answer;
      }

      if (!authType) {
        const answer = await p.select<AuthType>({
          message: 'How do you want to authenticate?',
          options: [
            { value: 'oauth', label: 'OAuth (browser login)', hint: 'runs nb env auth after save' },
            { value: 'token', label: 'API token / API key' },
          ],
          initialValue: 'oauth',
        });
        if (p.isCancel(answer)) {
          this.exitCancelled();
        }
        authType = answer;
      }
    }

    const accessTokenKeys = ['access-token', 'token'] as const;
    const accessTokenFlagPresent = accessTokenKeys.some((key) => Object.prototype.hasOwnProperty.call(flags, key));
    if (accessTokenFlagPresent && !flags['access-token'] && !flags['token']) {
      if (!interactive) {
        this.error(
          'When passing --access-token (or --token) without a value, run in a TTY or provide the token as the flag value.',
        );
      }
      const prompted = await p.password({
        message: 'Access token / API key',
        validate: (value) => (value.trim() ? undefined : 'Token cannot be empty'),
      });
      if (p.isCancel(prompted)) {
        this.exitCancelled();
      }
      flags['access-token'] = prompted;
    }

    let token = flags['access-token'] ?? flags['token'];

    if (!name?.trim()) {
      this.error('Environment name cannot be empty.');
    }
    if (!baseUrl?.trim()) {
      this.error('API base URL cannot be empty.');
    }

    name = name.trim();
    baseUrl = baseUrl.trim();

    if (authType === 'token') {
      if (!token && interactive) {
        const answer = await p.password({
          message: 'Access token / API key',
          validate: (value) => (value.trim() ? undefined : 'Token cannot be empty'),
        });
        if (p.isCancel(answer)) {
          this.exitCancelled();
        }
        token = answer;
      }
      if (!token?.trim()) {
        this.error(
          'Auth type token requires an access token. Pass `--access-token`, or run in a TTY to enter it.',
        );
      }

      printVerbose(`Saving env "${name}" with API base URL ${baseUrl} (token auth)`);
      await upsertEnv(name, { baseUrl, accessToken: token }, { scope });
      this.log(
        `Saved env "${name}" and set it as current${scope ? ` in ${formatCliHomeScope(scope)} scope` : ''}.`,
      );
      return;
    }

    printVerbose(`Saving env "${name}" with API base URL ${baseUrl} (OAuth next)`);
    await upsertEnv(name, { baseUrl }, { scope });
    this.log(
      `Saved env "${name}"${scope ? ` in ${formatCliHomeScope(scope)} scope` : ''}. Starting OAuth login (\`nb env auth ${name}\`).`,
    );

    const authArgv = [name];
    if (scope) {
      authArgv.push('-s', scope);
    }
    await this.config.runCommand('env:auth', authArgv);
  }
}
