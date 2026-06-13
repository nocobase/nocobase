/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core';
import { getCurrentEnvName, getEnv, resolveConfiguredAuthType, updateEnvConnection } from '../../lib/auth-store.js';
import { resolveDefaultConfigScope } from '../../lib/cli-home.js';
import { authenticateEnvWithBasic, authenticateEnvWithOauth } from '../../lib/env-auth.js';
import { runPromptCatalog, type PromptsCatalog } from '../../lib/prompt-catalog.js';
import { failTask, isInteractiveTerminal, printStage, startTask, stopTask, succeedTask } from '../../lib/ui.js';
import EnvAdd from './add.ts';

const envAuthPrompts: PromptsCatalog = {
  authType: EnvAdd.prompts.authType,
  username: EnvAdd.prompts.username,
  password: EnvAdd.prompts.password,
  accessToken: EnvAdd.prompts.accessToken,
};

function resolveExplicitAuthType(value: unknown): 'basic' | 'token' | 'oauth' | undefined {
  return value === 'basic' || value === 'token' || value === 'oauth' ? value : undefined;
}

function formatMissingEnvMessage(envName: string): string {
  return [`Env "${envName}" is not configured.`, `Run \`nb init --ui --env ${envName}\` first.`].join('\n');
}

export default class EnvAuth extends Command {
  static override summary = 'Authenticate a saved NocoBase environment with basic login, a token, or OAuth';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> prod',
    '<%= config.bin %> <%= command.id %> prod --auth-type basic --username admin --password secret',
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
      description: 'Authentication: basic (username/password login), token (API key), or oauth (browser login)',
      options: ['basic', 'token', 'oauth'],
    }),
    'access-token': Flags.string({
      char: 't',
      description: 'API key or access token when using token authentication',
    }),
    username: Flags.string({
      description: 'Username when using basic authentication (prompted in a TTY when omitted)',
    }),
    password: Flags.string({
      description: 'Password when using basic authentication (prompted in a TTY when omitted)',
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
    const envName = nameArg || nameFlag || (await getCurrentEnvName({ scope: resolveDefaultConfigScope() }));
    const env = await getEnv(envName, { scope: resolveDefaultConfigScope() });
    if (!env) {
      this.error(formatMissingEnvMessage(envName));
    }

    const tokenFromFlags = flags['access-token'];
    const tokenFlagProvided = tokenFromFlags !== undefined;
    const tokenValue = typeof tokenFromFlags === 'string' ? tokenFromFlags.trim() : '';
    const tokenProvided = tokenValue !== '';
    if (tokenFlagProvided && !tokenProvided) {
      this.error('--access-token cannot be empty.');
    }
    const usernameFromFlags = flags.username;
    const usernameFlagProvided = usernameFromFlags !== undefined;
    const usernameProvided = typeof usernameFromFlags === 'string' && usernameFromFlags.trim() !== '';
    if (usernameFlagProvided && !usernameProvided) {
      this.error('--username cannot be empty.');
    }
    const passwordFromFlags = flags.password;
    const passwordFlagProvided = passwordFromFlags !== undefined;
    const passwordProvided = typeof passwordFromFlags === 'string' && passwordFromFlags.trim() !== '';
    if (passwordFlagProvided && !passwordProvided) {
      this.error('--password cannot be empty.');
    }
    const explicitAuthType = resolveExplicitAuthType(flags['auth-type']);
    if (tokenFlagProvided && (usernameFlagProvided || passwordFlagProvided)) {
      this.error('--access-token cannot be used with --username or --password.');
    }
    if (explicitAuthType === 'oauth' && (tokenFlagProvided || usernameFlagProvided || passwordFlagProvided)) {
      this.error('--auth-type oauth cannot be used with --access-token, --username, or --password.');
    }
    if (explicitAuthType === 'token' && (usernameFlagProvided || passwordFlagProvided)) {
      this.error('--auth-type token cannot be used with --username or --password.');
    }
    if (explicitAuthType === 'basic' && tokenFlagProvided) {
      this.error('--auth-type basic cannot be used with --access-token.');
    }
    const savedAuthType = resolveConfiguredAuthType(env.config);
    const resolvedAuthType =
      explicitAuthType ??
      (tokenProvided ? 'token' : usernameFlagProvided || passwordFlagProvided ? 'basic' : savedAuthType);
    if (resolvedAuthType === 'basic' && !usernameProvided && !isInteractiveTerminal()) {
      this.error('--username is required when using basic authentication in non-interactive mode.');
    }
    if (resolvedAuthType === 'basic' && !passwordProvided && !isInteractiveTerminal()) {
      this.error('--password is required when using basic authentication in non-interactive mode.');
    }
    const prompted =
      (resolvedAuthType === 'oauth'
        ? { authType: 'oauth' }
        : await runPromptCatalog(envAuthPrompts, {
            values: {
              ...(resolvedAuthType ? { authType: resolvedAuthType } : {}),
              ...(usernameFlagProvided ? { username: String(usernameFromFlags ?? '').trim() } : {}),
              ...(passwordFlagProvided ? { password: String(passwordFromFlags ?? '') } : {}),
              ...(tokenFlagProvided ? { accessToken: tokenValue } : {}),
            },
            command: this,
          })) ?? {};
    const authType = resolveExplicitAuthType(prompted.authType ?? resolvedAuthType);
    if (!authType) {
      this.error('Choose an authentication type before continuing.');
    }

    printStage('Authenticating');
    try {
      if (authType === 'basic') {
        const username = String(prompted.username ?? usernameFromFlags ?? '').trim();
        const password = String(prompted.password ?? passwordFromFlags ?? '');
        if (!username) {
          this.error('--username is required when using basic authentication.');
        }
        if (!password) {
          this.error('--password cannot be empty.');
        }
        startTask(`Signing in with username and password for "${envName}"...`);
        const accessToken = await authenticateEnvWithBasic({
          envName,
          username,
          password,
          scope: resolveDefaultConfigScope(),
        });
        await updateEnvConnection(
          envName,
          {
            authType: 'basic',
            authUsername: username,
            accessToken,
          },
          { scope: resolveDefaultConfigScope() },
        );
        stopTask();
      } else if (authType === 'token') {
        const accessToken = String(prompted.accessToken ?? tokenFromFlags ?? '').trim();
        if (accessToken === '') {
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
