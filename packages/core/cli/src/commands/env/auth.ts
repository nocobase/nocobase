/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core';
import {
  getCurrentEnvName,
  getEnv,
  resolveConfiguredAuthType,
  updateEnvConnection,
} from '../../lib/auth-store.js';
import { resolveDefaultConfigScope } from '../../lib/cli-home.js';
import { authenticateEnvWithOauth } from '../../lib/env-auth.js';
import { runPromptCatalog, type PromptsCatalog } from '../../lib/prompt-catalog.js';
import { failTask, printStage, startTask, stopTask, succeedTask } from '../../lib/ui.js';
import EnvAdd from './add.ts';

const envAuthPrompts: PromptsCatalog = {
  authType: EnvAdd.prompts.authType,
  accessToken: EnvAdd.prompts.accessToken,
};

function resolveExplicitAuthType(value: unknown): 'token' | 'oauth' | undefined {
  return value === 'token' || value === 'oauth' ? value : undefined;
}

function formatMissingEnvMessage(envName: string): string {
  return [
    `Env "${envName}" is not configured.`,
    `Run \`nb env add ${envName} --api-base-url <url>\` first.`,
  ].join('\n');
}

export default class EnvAuth extends Command {
  static override summary = 'Authenticate a saved NocoBase environment with a token or OAuth';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> prod',
    '<%= config.bin %> <%= command.id %> prod --auth-type token --access-token <api-key>',
  ];

  static override args = {
    name: Args.string({
      description: 'Configured environment name to sign in to. Defaults to the current env when omitted',
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
    'auth-type': Flags.string({
      char: 'a',
      description: 'Authentication: token (API key) or oauth (browser login)',
      options: ['token', 'oauth'],
    }),
    'access-token': Flags.string({
      char: 't',
      description: 'API key or access token when using token authentication',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(EnvAuth);
    const nameArg = args.name?.trim();
    const nameFlag = flags.env?.trim() || undefined;
    if (nameArg && nameFlag && nameArg !== nameFlag) {
      this.error(
        `Environment name was provided both as the argument ("${nameArg}") and as --env ("${nameFlag}"). Please use only one.`,
      );
    }
    if (flags['auth-type'] === 'oauth' && flags['access-token'] !== undefined) {
      this.error('--access-token cannot be used with --auth-type oauth.');
    }
    const envName = nameArg || nameFlag || (await getCurrentEnvName({ scope: resolveDefaultConfigScope() }));
    const env = await getEnv(envName, { scope: resolveDefaultConfigScope() });
    if (!env) {
      this.error(formatMissingEnvMessage(envName));
    }

    const tokenFromFlags = flags['access-token'];
    const tokenFlagProvided = tokenFromFlags !== undefined;
    const tokenProvided = typeof tokenFromFlags === 'string' && tokenFromFlags !== '';
    if (tokenFlagProvided && !tokenProvided) {
      this.error('--access-token cannot be empty.');
    }
    const explicitAuthType = resolveExplicitAuthType(flags['auth-type']);
    const savedAuthType = resolveConfiguredAuthType(env.config);
    const resolvedAuthType = explicitAuthType ?? (tokenProvided ? 'token' : savedAuthType);
    const prompted = (
      resolvedAuthType === 'oauth'
        ? { authType: 'oauth' }
        : resolvedAuthType === 'token' && tokenProvided
        ? { authType: 'token', accessToken: tokenFromFlags }
        : await runPromptCatalog(envAuthPrompts, {
            values: {
              ...(resolvedAuthType ? { authType: resolvedAuthType } : {}),
            },
            command: this,
          })
    ) ?? {};
    const authType = resolveExplicitAuthType(prompted.authType ?? resolvedAuthType);
    if (!authType) {
      this.error('Choose an authentication type before continuing.');
    }

    printStage('Authenticating');
    try {
      if (authType === 'token') {
        const accessToken = String(prompted.accessToken ?? tokenFromFlags ?? '');
        if (accessToken.trim() === '') {
          this.error('--access-token cannot be empty.');
        }
        startTask(`Saving access token for "${envName}"...`);
        await updateEnvConnection(
          envName,
          {
            authType: 'token',
            accessToken,
          },
          { scope: resolveDefaultConfigScope() },
        );
        stopTask();
      } else {
        startTask(`Starting browser sign-in for "${envName}"...`);
        await updateEnvConnection(
          envName,
          {
            authType: 'oauth',
          },
          { scope: resolveDefaultConfigScope() },
        );
        await authenticateEnvWithOauth({
          envName,
          scope: resolveDefaultConfigScope(),
        });
        stopTask();
      }

      await this.config.runCommand('env:update', [envName]);
      succeedTask(`✔ Authenticated "${envName}".`);
    } catch (error) {
      failTask(`Authentication failed for "${envName}".`);
      throw error;
    }
  }
}
