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
import { PROXY_PROVIDER_OPTIONS, type ProxyProvider } from '../../lib/cli-config.js';
import {
  applyEnvProxyAppEntryOptions,
  appConfigIncludesGeneratedConfig,
  appConfigHasManagedGeneratedConfigBlock,
  buildManagedAppEntryGeneratedConfigBlock,
  buildEnvProxyAppConfig,
  buildEnvProxyConfig,
  buildLegacyEnvProxyConfig,
  buildEnvProxyMainConfig,
  installEnvProxyProvider,
  isLegacyEnvProxyAppConfig,
  reloadEnvProxyProvider,
  replaceManagedAppEntryGeneratedConfigBlock,
  resolveEnvProxyAppOutputPath,
  resolveEnvProxyProvider,
  resolveEnvProxyMainOutputPath,
  resolveEnvProxyOutputPath,
  resolveLegacyNginxEnvProxyAppOutputPath,
  resolveLegacyNginxEnvProxyOutputPath,
  mapProxyPathFromCliRoot,
  type EnvProxyAppEntryOptions,
} from '../../lib/env-proxy.js';
import { announceTargetEnv, failTask, startTask, succeedTask } from '../../lib/ui.js';

async function readOptionalTextFile(filePath: string): Promise<string | undefined> {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error: unknown) {
    const code = error && typeof error === 'object' && 'code' in error ? (error as { code?: unknown }).code : undefined;
    if (code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}

function buildEditableAppEntryReferenceLine(provider: ProxyProvider, generatedConfigPath: string): string {
  if (provider === 'caddy') {
    return `import ./${path.basename(generatedConfigPath)}`;
  }

  return `include ${generatedConfigPath};`;
}

function replaceEditableAppEntryReferenceWithManagedBlock(
  content: string,
  provider: ProxyProvider,
  currentGeneratedConfigPath: string,
  nextGeneratedConfigPath: string,
): string {
  const currentReferenceLine = buildEditableAppEntryReferenceLine(provider, currentGeneratedConfigPath);
  const nextBlock = buildManagedAppEntryGeneratedConfigBlock(provider, nextGeneratedConfigPath);
  const escapedComment =
    provider === 'caddy'
      ? '# Keep this import so `nb env proxy` can refresh managed routes.'
      : '# Keep this include so `nb env proxy` can refresh managed routes.';
  const escapedCommentPattern = escapedComment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedLinePattern = currentReferenceLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const legacyBlockPattern = new RegExp(
    `[ \\t]*${escapedCommentPattern}\\n[ \\t]*${escapedLinePattern.replace(/;$/, ';?')}`,
    'm',
  );

  if (legacyBlockPattern.test(content)) {
    return content.replace(legacyBlockPattern, nextBlock);
  }

  return content.replace(currentReferenceLine, nextBlock);
}

function normalizeProxyListenPort(value?: string): string | undefined {
  const normalized = value?.trim() || undefined;
  if (!normalized || !/^\d+$/.test(normalized)) {
    return undefined;
  }

  const port = Number(normalized);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return undefined;
  }

  return normalized;
}

export default class EnvProxy extends Command {
  static override summary = 'Generate a proxy config for one managed env';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> app1',
    '<%= config.bin %> <%= command.id %> app1 --output ./generated.conf',
    '<%= config.bin %> <%= command.id %> app1 --provider nginx --install --reload',
    '<%= config.bin %> <%= command.id %> app1 --provider caddy --install --reload',
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
      description: 'Output file path. Defaults to ~/.nocobase/proxy/<provider>/<env>/generated.<ext>',
    }),
    provider: Flags.string({
      description: 'Proxy provider to render and operate on',
      options: [...PROXY_PROVIDER_OPTIONS],
    }),
    host: Flags.string({
      description: 'Host exposed by the proxy entry config, such as example.com or localhost',
    }),
    port: Flags.string({
      description: 'Port exposed by the proxy entry config, not the upstream NocoBase app port',
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
    const requestedHost = flags.host?.trim() || undefined;
    const requestedPort = flags.port?.trim() || undefined;

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

    if (requestedPort && !normalizeProxyListenPort(requestedPort)) {
      this.error(
        translateCli(
          'commands.envProxy.errors.invalidProxyPort',
          { port: requestedPort },
          {
            fallback: `Invalid proxy entry port "${requestedPort}". Use an integer between 1 and 65535.`,
          },
        ),
      );
    }

    const appEntryOptions: EnvProxyAppEntryOptions = {
      host: requestedHost,
      port: normalizeProxyListenPort(requestedPort),
    };

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
            `The editable app entry config at ${appConfigPath} does not reference ${generatedConfigPath}. ` +
            `Add the managed generated-config reference back into the editable app entry, or replace the legacy managed routes and rerun the command.`,
        },
      );

    try {
      const result = await buildEnvProxyConfig(runtime, { provider, scope });
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
        provider,
        scope,
      });
      const renderedOutputPath = await mapProxyPathFromCliRoot(outputPath, { scope });
      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeFile(outputPath, result.content, 'utf8');

      const shouldWriteSharedConfig = !flags.output;
      let appConfigPath: string | undefined;
      let appConfigStatus: 'created' | 'migrated' | 'existing' | undefined;
      let sharedOutputPath: string | undefined;
      if (shouldWriteSharedConfig) {
        appConfigPath = resolveEnvProxyAppOutputPath(runtime.envName, {
          provider,
          scope,
        });
        const legacyAppConfigPath =
          provider === 'nginx'
            ? resolveLegacyNginxEnvProxyAppOutputPath(runtime.envName, {
                scope,
              })
            : undefined;
        const appConfigContent =
          (await readOptionalTextFile(appConfigPath)) ??
          (legacyAppConfigPath ? await readOptionalTextFile(legacyAppConfigPath) : undefined);
        const nextAppConfigContent = buildEnvProxyAppConfig(provider, renderedOutputPath, appEntryOptions);
        const legacyOutputPath =
          provider === 'nginx'
            ? resolveLegacyNginxEnvProxyOutputPath(runtime.envName, {
                scope,
              })
            : undefined;
        const legacyRenderedOutputPath = legacyOutputPath
          ? await mapProxyPathFromCliRoot(legacyOutputPath, {
              scope,
            })
          : undefined;

        if (!appConfigContent) {
          await writeFile(appConfigPath, nextAppConfigContent, 'utf8');
          appConfigStatus = 'created';
        } else if (appConfigHasManagedGeneratedConfigBlock(appConfigContent)) {
          const nextContent = applyEnvProxyAppEntryOptions(
            replaceManagedAppEntryGeneratedConfigBlock(appConfigContent, provider, renderedOutputPath),
            provider,
            appEntryOptions,
          );
          if (nextContent !== appConfigContent) {
            await writeFile(appConfigPath, nextContent, 'utf8');
            appConfigStatus = 'migrated';
          } else {
            appConfigStatus = 'existing';
          }
        } else {
          const candidateGeneratedPaths = [outputPath, legacyOutputPath, legacyRenderedOutputPath].filter(
            (value): value is string => Boolean(value && value !== renderedOutputPath),
          );
          if (appConfigIncludesGeneratedConfig(appConfigContent, renderedOutputPath, provider)) {
            candidateGeneratedPaths.unshift(renderedOutputPath);
          }
          const matchedGeneratedPath = candidateGeneratedPaths.find((generatedConfigPath) =>
            appConfigIncludesGeneratedConfig(appConfigContent, generatedConfigPath, provider),
          );

          if (matchedGeneratedPath) {
            await writeFile(
              appConfigPath,
              applyEnvProxyAppEntryOptions(
                replaceEditableAppEntryReferenceWithManagedBlock(
                  appConfigContent,
                  provider,
                  matchedGeneratedPath,
                  renderedOutputPath,
                ),
                provider,
                appEntryOptions,
              ),
              'utf8',
            );
            appConfigStatus = 'migrated';
          } else if (provider === 'nginx') {
            const legacyConfig = await buildLegacyEnvProxyConfig(runtime, { provider, scope });
            if (!isLegacyEnvProxyAppConfig(appConfigContent, legacyConfig.content)) {
              throw new Error(appEntryMissingIncludeMessage(appConfigPath, renderedOutputPath));
            }

            await writeFile(appConfigPath, nextAppConfigContent, 'utf8');
            appConfigStatus = 'migrated';
          } else {
            throw new Error(appEntryMissingIncludeMessage(appConfigPath, renderedOutputPath));
          }
        }

        sharedOutputPath = resolveEnvProxyMainOutputPath({
          provider,
          scope,
        });
        await mkdir(path.dirname(sharedOutputPath), { recursive: true });
        await writeFile(
          sharedOutputPath,
          await buildEnvProxyMainConfig({
            provider,
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
