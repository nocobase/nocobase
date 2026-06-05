/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Args, Command, Flags } from '@oclif/core';
import { formatMissingManagedAppEnvMessage, resolveManagedAppRuntime } from '../../lib/app-runtime.js';
import { resolveDefaultConfigScope } from '../../lib/cli-home.js';
import { translateCli } from '../../lib/cli-locale.js';
import { PROXY_PROVIDER_OPTIONS } from '../../lib/cli-config.js';
import {
  appConfigIncludesGeneratedConfig,
  buildEnvProxyAppConfig,
  buildEnvProxyConfig,
  buildLegacyEnvProxyConfig,
  buildEnvProxyMainConfig,
  installEnvProxyProvider,
  isLegacyEnvProxyAppConfig,
  reloadEnvProxyProvider,
  resolveEnvProxyAppOutputPath,
  resolveEnvProxyProvider,
  resolveEnvProxyMainOutputPath,
  resolveEnvProxyOutputPath,
} from '../../lib/env-proxy.js';
import { announceTargetEnv, failTask, startTask, succeedTask } from '../../lib/ui.js';

export default class EnvProxy extends Command {
  static override summary = 'Generate an nginx proxy config for one managed env';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> app1',
    '<%= config.bin %> <%= command.id %> app1 --output ./generated.conf',
    '<%= config.bin %> <%= command.id %> app1 --provider nginx --install --reload',
    '<%= config.bin %> <%= command.id %> app1 --print',
  ];

  static override args = {
    name: Args.string({
      description:
        'Configured environment name to generate a proxy config for. Defaults to the current env when omitted',
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
    output: Flags.string({
      char: 'o',
      description: 'Output file path. Defaults to ~/.nocobase/proxy/<env>/generated.conf',
    }),
    provider: Flags.string({
      description: 'Proxy provider to render and operate on',
      options: [...PROXY_PROVIDER_OPTIONS],
    }),
    install: Flags.boolean({
      description: 'Install the rendered provider config into the provider main config when supported',
      default: false,
    }),
    reload: Flags.boolean({
      description: 'Validate and reload the provider after writing the proxy config',
      default: false,
    }),
    print: Flags.boolean({
      description: 'Print the generated config to stdout instead of writing a file',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(EnvProxy);
    const scope = resolveDefaultConfigScope();
    const envNameArg = args.name?.trim() || undefined;
    const envNameFlag = flags.env?.trim() || undefined;
    const requestedProvider = flags.provider?.trim() || undefined;

    if (envNameArg && envNameFlag && envNameArg !== envNameFlag) {
      this.error(
        `Environment name was provided both as the argument ("${envNameArg}") and as --env ("${envNameFlag}"). Please use only one.`,
      );
    }

    if (flags.print && (flags.install || flags.reload)) {
      this.error('`--print` cannot be combined with `--install` or `--reload`.');
    }

    if (flags.output && (flags.install || flags.reload)) {
      this.error('`--output` cannot be combined with `--install` or `--reload` in the current implementation.');
    }

    const requestedEnv = envNameArg || envNameFlag;
    const runtime = await resolveManagedAppRuntime(requestedEnv);
    if (!runtime) {
      this.error(formatMissingManagedAppEnvMessage(requestedEnv));
    }

    if (runtime.kind === 'http') {
      this.error(
        translateCli(
          'commands.envProxy.errors.httpEnvUnsupported',
          { envName: runtime.envName },
          {
            fallback: `Can't generate a proxy config for "${runtime.envName}" from this machine because the env only has an API connection.`,
          },
        ),
      );
    }

    if (runtime.kind === 'ssh') {
      this.error(
        translateCli(
          'commands.envProxy.errors.sshEnvUnsupported',
          { envName: runtime.envName },
          {
            fallback: `Can't generate a proxy config for "${runtime.envName}" yet because SSH envs are not implemented.`,
          },
        ),
      );
    }

    announceTargetEnv(runtime.envName);
    const provider = await resolveEnvProxyProvider(requestedProvider, { scope });
    startTask(
      translateCli(
        'commands.envProxy.messages.generating',
        { envName: runtime.envName },
        {
          fallback: `Generating proxy config for env "${runtime.envName}"...`,
        },
      ),
    );

    const generationFailureMessage = translateCli(
      'commands.envProxy.messages.failed',
      { envName: runtime.envName },
      {
        fallback: `Failed to generate proxy config for env "${runtime.envName}".`,
      },
    );
    const installStartMessage = translateCli(
      'commands.envProxy.messages.installingProvider',
      { provider },
      {
        fallback: `Installing the shared proxy config into ${provider}...`,
      },
    );
    const installFailureMessage = translateCli(
      'commands.envProxy.messages.installProviderFailed',
      { provider },
      {
        fallback: `Failed to install the shared proxy config into ${provider}.`,
      },
    );
    const reloadStartMessage = translateCli(
      'commands.envProxy.messages.reloadingProvider',
      { provider },
      {
        fallback: `Validating and reloading ${provider}...`,
      },
    );
    const reloadFailureMessage = translateCli(
      'commands.envProxy.messages.reloadProviderFailed',
      { provider },
      {
        fallback: `Failed to validate and reload ${provider}.`,
      },
    );
    const appEntryMissingIncludeMessage = (appConfigPath: string, generatedConfigPath: string) =>
      translateCli(
        'commands.envProxy.errors.appEntryMissingInclude',
        {
          envName: runtime.envName,
          appConfigPath,
          generatedConfigPath,
        },
        {
          fallback:
            `The editable app entry config at ${appConfigPath} does not include ${generatedConfigPath}. ` +
            `Add \`include ${generatedConfigPath};\` inside the server block, or replace the legacy managed routes in app.conf and rerun the command.`,
        },
      );

    try {
      const result = await buildEnvProxyConfig(runtime);
      if (flags.print) {
        process.stdout.write(result.content);
        succeedTask(
          translateCli(
            'commands.envProxy.messages.printed',
            { envName: runtime.envName },
            {
              fallback: `Printed proxy config for env "${runtime.envName}".`,
            },
          ),
        );
        return;
      }

      const outputPath = resolveEnvProxyOutputPath(runtime.envName, {
        output: flags.output,
        scope,
      });
      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeFile(outputPath, result.content, 'utf8');

      const shouldWriteSharedConfig = !flags.output;
      let appConfigPath: string | undefined;
      let appConfigStatus: 'created' | 'migrated' | 'existing' | undefined;
      let sharedOutputPath: string | undefined;
      if (shouldWriteSharedConfig) {
        appConfigPath = resolveEnvProxyAppOutputPath(runtime.envName, {
          scope,
        });
        const appConfigContent = await readFile(appConfigPath, 'utf8').catch((error: NodeJS.ErrnoException) => {
          if (error.code === 'ENOENT') {
            return undefined;
          }
          throw error;
        });
        const nextAppConfigContent = buildEnvProxyAppConfig(outputPath);

        if (!appConfigContent) {
          await writeFile(appConfigPath, nextAppConfigContent, 'utf8');
          appConfigStatus = 'created';
        } else if (appConfigIncludesGeneratedConfig(appConfigContent, outputPath)) {
          appConfigStatus = 'existing';
        } else {
          const legacyConfig = await buildLegacyEnvProxyConfig(runtime);
          if (!isLegacyEnvProxyAppConfig(appConfigContent, legacyConfig.content)) {
            throw new Error(appEntryMissingIncludeMessage(appConfigPath, outputPath));
          }

          await writeFile(appConfigPath, nextAppConfigContent, 'utf8');
          appConfigStatus = 'migrated';
        }

        sharedOutputPath = resolveEnvProxyMainOutputPath({
          scope,
        });
        await mkdir(path.dirname(sharedOutputPath), { recursive: true });
        await writeFile(
          sharedOutputPath,
          buildEnvProxyMainConfig({
            scope,
          }),
          'utf8',
        );
      }

      succeedTask(
        translateCli(
          appConfigStatus === 'created'
            ? 'commands.envProxy.messages.savedWithAppEntryCreated'
            : appConfigStatus === 'migrated'
              ? 'commands.envProxy.messages.savedWithAppEntryMigrated'
              : 'commands.envProxy.messages.saved',
          { envName: runtime.envName, outputPath, sharedOutputPath, provider, appConfigPath },
          {
            fallback:
              appConfigStatus === 'created'
                ? `Saved generated proxy config for env "${runtime.envName}" at ${outputPath}, and created editable app entry config at ${appConfigPath}.`
                : appConfigStatus === 'migrated'
                  ? `Saved generated proxy config for env "${runtime.envName}" at ${outputPath}, and migrated the app entry config at ${appConfigPath}.`
                  : `Saved generated proxy config for env "${runtime.envName}" at ${outputPath}.`,
          },
        ),
      );
    } catch (error) {
      failTask(generationFailureMessage);
      this.error(error instanceof Error ? error.message : String(error));
    }

    if (flags.install) {
      startTask(installStartMessage);
      try {
        const installResult = await installEnvProxyProvider(provider, { scope });
        succeedTask(
          installResult.status === 'already-installed'
            ? translateCli(
                'commands.envProxy.messages.providerAlreadyInstalled',
                { provider, configPath: installResult.configPath },
                {
                  fallback: `The shared proxy config is already installed in the ${provider} main config at ${installResult.configPath}.`,
                },
              )
            : translateCli(
                'commands.envProxy.messages.providerInstalled',
                { provider, configPath: installResult.configPath },
                {
                  fallback: `Installed the shared proxy config into the ${provider} main config at ${installResult.configPath}.`,
                },
              ),
        );
      } catch (error) {
        failTask(installFailureMessage);
        this.error(error instanceof Error ? error.message : String(error));
      }
    }

    if (flags.reload) {
      startTask(reloadStartMessage);
      try {
        await reloadEnvProxyProvider(provider, { scope });
        succeedTask(
          translateCli(
            'commands.envProxy.messages.providerReloaded',
            { provider },
            {
              fallback: `Validated and reloaded ${provider}.`,
            },
          ),
        );
      } catch (error) {
        failTask(reloadFailureMessage);
        this.error(error instanceof Error ? error.message : String(error));
      }
    }
  }
}
