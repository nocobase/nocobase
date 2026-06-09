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
import { Args, Command, Flags, loadHelpClass } from '@oclif/core';
import {
  formatMissingManagedAppEnvMessage,
  resolveManagedAppRuntime,
  type ManagedAppRuntime,
} from '../../../lib/app-runtime.js';
import { resolveDefaultConfigScope } from '../../../lib/cli-home.js';
import { translateCli } from '../../../lib/cli-locale.js';
import { type ProxyProvider } from '../../../lib/cli-config.js';
import {
  applyEnvProxyAppEntryOptions,
  appConfigIncludesGeneratedConfig,
  appConfigHasManagedGeneratedConfigBlock,
  appConfigHasManagedNginxBlock,
  buildManagedAppEntryGeneratedConfigBlock,
  buildEnvProxyCaddyBundle,
  buildEnvProxyMainConfig,
  buildEnvProxyNginxBundle,
  extractManagedNginxConfigBlock,
  installEnvProxyProvider,
  reloadEnvProxyProvider,
  replaceManagedAppEntryGeneratedConfigBlock,
  replaceManagedNginxConfigBlock,
  resolveEnvProxyAppOutputPath,
  resolveEnvProxyMainOutputPath,
  syncEnvProxyNginxSnippets,
  type EnvProxyAppEntryOptions,
  type EnvProxyCaddyBundle,
  type EnvProxyNginxBundle,
} from '../../../lib/env-proxy.js';
import { announceTargetEnv, failTask, startTask, succeedTask } from '../../../lib/ui.js';

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

type WritableProxyRuntime = Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>;

type NginxProxyWriteResult = {
  bundle: EnvProxyNginxBundle;
  status: 'created' | 'updated';
};

type CaddyProxyWriteResult = {
  bundle: EnvProxyCaddyBundle;
  status: 'created' | 'migrated' | 'updated';
};

function buildNginxManagedBlockMissingMessage(appConfigPath: string): string {
  return translateCli(
    'commands.envProxy.errors.nginxAppEntryMissingManagedBlock',
    {
      appConfigPath,
    },
    {
      fallback:
        `The editable nginx app entry config at ${appConfigPath} does not contain the NocoBase managed block. ` +
        'Restore the managed block or delete the file and rerun `nb env proxy`.',
    },
  );
}

async function writeNginxProxyBundle(
  runtime: WritableProxyRuntime,
  appEntryOptions: EnvProxyAppEntryOptions,
  options?: {
    scope?: ReturnType<typeof resolveDefaultConfigScope>;
  },
): Promise<NginxProxyWriteResult> {
  const bundle = await buildEnvProxyNginxBundle(runtime, { scope: options?.scope });
  const managedConfigBlock = extractManagedNginxConfigBlock(bundle.appConfigContent);
  if (!managedConfigBlock) {
    throw new Error('Failed to render the managed nginx config block.');
  }

  const currentAppConfigContent = await readOptionalTextFile(bundle.appConfigPath);
  let nextAppConfigContent = applyEnvProxyAppEntryOptions(bundle.appConfigContent, 'nginx', appEntryOptions);
  let status: NginxProxyWriteResult['status'] = 'created';

  if (currentAppConfigContent) {
    if (!appConfigHasManagedNginxBlock(currentAppConfigContent)) {
      throw new Error(buildNginxManagedBlockMissingMessage(bundle.appConfigPath));
    }

    nextAppConfigContent = applyEnvProxyAppEntryOptions(
      replaceManagedNginxConfigBlock(currentAppConfigContent, managedConfigBlock),
      'nginx',
      appEntryOptions,
    );
    status = 'updated';
  }

  await Promise.all([mkdir(bundle.entryDir, { recursive: true }), mkdir(bundle.publicDir, { recursive: true })]);
  await Promise.all([
    writeFile(bundle.appConfigPath, nextAppConfigContent, 'utf8'),
    writeFile(bundle.indexV1Path, bundle.indexV1Content, 'utf8'),
    writeFile(bundle.indexV2Path, bundle.indexV2Content, 'utf8'),
    writeFile(bundle.mainConfigPath, bundle.mainConfigContent, 'utf8'),
    syncEnvProxyNginxSnippets({ scope: options?.scope }),
  ]);

  return {
    bundle,
    status,
  };
}

async function writeCaddyProxyBundle(
  runtime: WritableProxyRuntime,
  appEntryOptions: EnvProxyAppEntryOptions,
  options?: {
    scope?: ReturnType<typeof resolveDefaultConfigScope>;
  },
): Promise<CaddyProxyWriteResult> {
  const bundle = await buildEnvProxyCaddyBundle(runtime, { scope: options?.scope });
  const currentAppConfigContent = await readOptionalTextFile(bundle.appConfigPath);
  let nextAppConfigContent = applyEnvProxyAppEntryOptions(bundle.appConfigContent, 'caddy', appEntryOptions);
  let status: CaddyProxyWriteResult['status'] = 'created';

  if (currentAppConfigContent) {
    if (appConfigHasManagedGeneratedConfigBlock(currentAppConfigContent)) {
      nextAppConfigContent = applyEnvProxyAppEntryOptions(
        replaceManagedAppEntryGeneratedConfigBlock(currentAppConfigContent, 'caddy', bundle.generatedConfigPath),
        'caddy',
        appEntryOptions,
      );
      status = 'updated';
    } else if (appConfigIncludesGeneratedConfig(currentAppConfigContent, bundle.generatedConfigPath, 'caddy')) {
      nextAppConfigContent = applyEnvProxyAppEntryOptions(
        replaceEditableAppEntryReferenceWithManagedBlock(
          currentAppConfigContent,
          'caddy',
          bundle.generatedConfigPath,
          bundle.generatedConfigPath,
        ),
        'caddy',
        appEntryOptions,
      );
      status = 'migrated';
    } else {
      throw new Error(
        translateCli(
          'commands.envProxy.errors.appEntryMissingInclude',
          {
            envName: runtime.envName,
            appConfigPath: bundle.appConfigPath,
            generatedConfigPath: bundle.generatedConfigPath,
          },
          {
            fallback:
              `The editable app entry config at ${bundle.appConfigPath} does not reference ${bundle.generatedConfigPath}. ` +
              'Add the managed generated-config reference back into the editable app entry and rerun the command.',
          },
        ),
      );
    }
  }

  await Promise.all([mkdir(bundle.entryDir, { recursive: true }), mkdir(bundle.publicDir, { recursive: true })]);
  await Promise.all([
    writeFile(bundle.appConfigPath, nextAppConfigContent, 'utf8'),
    writeFile(bundle.generatedConfigPath, bundle.generatedConfigContent, 'utf8'),
    writeFile(bundle.indexV1Path, bundle.indexV1Content, 'utf8'),
    writeFile(bundle.indexV2Path, bundle.indexV2Content, 'utf8'),
    writeFile(bundle.mainConfigPath, bundle.mainConfigContent, 'utf8'),
  ]);

  return {
    bundle,
    status,
  };
}

export const ENV_PROXY_NAME_ARG = Args.string({
  description: 'Configured environment name to generate a proxy config for. Defaults to the current env when omitted',
  required: false,
});

type EnvProxyFlagValues = {
  env?: string;
  host?: string;
  install: boolean;
  output?: string;
  port?: string;
  print: boolean;
  reload: boolean;
};

type EnvProxyArgs = {
  name?: string;
};

function createEnvProxySharedFlags() {
  return {
    env: Flags.string({
      char: 'e',
      description:
        'Configured environment name to generate a proxy config for. Defaults to the current env when omitted',
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
      description: 'Print the rendered config to stdout instead of writing files',
      default: false,
    }),
  };
}

export function createEnvProxyNginxFlags() {
  return {
    ...createEnvProxySharedFlags(),
  };
}

export function createEnvProxyCaddyFlags() {
  return {
    ...createEnvProxySharedFlags(),
    output: Flags.string({
      char: 'o',
      description: 'Output file path for providers that emit a single generated config file',
    }),
  };
}

function resolveRequestedEnv(command: Command, args: EnvProxyArgs, flags: EnvProxyFlagValues): string | undefined {
  const envNameArg = args.name?.trim() || undefined;
  const envNameFlag = flags.env?.trim() || undefined;

  if (envNameArg && envNameFlag && envNameArg !== envNameFlag) {
    command.error(
      `Environment name was provided both as the argument ("${envNameArg}") and as --env ("${envNameFlag}"). Please use only one.`,
    );
  }

  return envNameArg || envNameFlag;
}

function resolveAppEntryOptions(command: Command, flags: EnvProxyFlagValues): EnvProxyAppEntryOptions {
  const requestedHost = flags.host?.trim() || undefined;
  const requestedPort = flags.port?.trim() || undefined;

  if (requestedPort && !normalizeProxyListenPort(requestedPort)) {
    command.error(
      translateCli(
        'commands.envProxy.errors.invalidProxyPort',
        { port: requestedPort },
        {
          fallback: `Invalid proxy entry port "${requestedPort}". Use an integer between 1 and 65535.`,
        },
      ),
    );
  }

  return {
    host: requestedHost,
    port: normalizeProxyListenPort(requestedPort),
  };
}

export async function runEnvProxyCommand(
  command: Command,
  args: EnvProxyArgs,
  flags: EnvProxyFlagValues,
  provider: ProxyProvider,
): Promise<void> {
  const scope = resolveDefaultConfigScope();
  const requestedEnv = resolveRequestedEnv(command, args, flags);

  if (flags.print && (flags.install || flags.reload)) {
    command.error('`--print` cannot be combined with `--install` or `--reload`.');
  }

  if (flags.output && (flags.install || flags.reload)) {
    command.error('`--output` cannot be combined with `--install` or `--reload` in the current implementation.');
  }

  const appEntryOptions = resolveAppEntryOptions(command, flags);
  const runtime = await resolveManagedAppRuntime(requestedEnv);
  if (!runtime) {
    command.error(formatMissingManagedAppEnvMessage(requestedEnv));
  }

  if (runtime.kind === 'http') {
    command.error(
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
    command.error(
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
  if (flags.output) {
    command.error(
      translateCli(
        provider === 'nginx'
          ? 'commands.envProxy.errors.nginxOutputUnsupported'
          : 'commands.envProxy.errors.caddyOutputUnsupported',
        {
          envName: runtime.envName,
        },
        {
          fallback:
            provider === 'nginx'
              ? 'The nginx provider does not support `--output`. It writes `app.conf`, `public/index-v1.html`, `public/index-v2.html`, and `nocobase.conf` into `~/.nocobase/proxy/nginx/<env>/`.'
              : 'The caddy provider does not support `--output`. It writes `app.caddy`, `generated.caddy`, `public/index-v1.html`, `public/index-v2.html`, and `nocobase.caddy` into `~/.nocobase/proxy/caddy/<env>/`.',
        },
      ),
    );
  }

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

  try {
    if (flags.print) {
      if (provider === 'nginx') {
        const bundle = await buildEnvProxyNginxBundle(runtime, { scope });
        process.stdout.write(applyEnvProxyAppEntryOptions(bundle.appConfigContent, provider, appEntryOptions));
      } else {
        const bundle = await buildEnvProxyCaddyBundle(runtime, { scope });
        process.stdout.write(applyEnvProxyAppEntryOptions(bundle.appConfigContent, provider, appEntryOptions));
      }
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

    if (provider === 'nginx') {
      const { bundle, status } = await writeNginxProxyBundle(runtime, appEntryOptions, { scope });
      succeedTask(
        translateCli(
          status === 'created'
            ? 'commands.envProxy.messages.savedNginxBundleCreated'
            : 'commands.envProxy.messages.savedNginxBundleUpdated',
          {
            envName: runtime.envName,
            appConfigPath: bundle.appConfigPath,
            entryDir: bundle.entryDir,
          },
          {
            fallback:
              status === 'created'
                ? `Saved nginx proxy files for env "${runtime.envName}" under ${bundle.entryDir}, and created editable app entry config at ${bundle.appConfigPath}.`
                : `Saved nginx proxy files for env "${runtime.envName}" under ${bundle.entryDir}, and refreshed editable app entry config at ${bundle.appConfigPath}.`,
          },
        ),
      );
    } else {
      const { bundle, status } = await writeCaddyProxyBundle(runtime, appEntryOptions, { scope });

      succeedTask(
        translateCli(
          status === 'created'
            ? 'commands.envProxy.messages.savedCaddyBundleCreated'
            : status === 'migrated'
              ? 'commands.envProxy.messages.savedCaddyBundleMigrated'
              : 'commands.envProxy.messages.savedCaddyBundleUpdated',
          { envName: runtime.envName, entryDir: bundle.entryDir, appConfigPath: bundle.appConfigPath },
          {
            fallback:
              status === 'created'
                ? `Saved caddy proxy files for env "${runtime.envName}" under ${bundle.entryDir}, and created editable app entry config at ${bundle.appConfigPath}.`
                : status === 'migrated'
                  ? `Saved caddy proxy files for env "${runtime.envName}" under ${bundle.entryDir}, and migrated the app entry config at ${bundle.appConfigPath}.`
                  : `Saved caddy proxy files for env "${runtime.envName}" under ${bundle.entryDir}, and refreshed editable app entry config at ${bundle.appConfigPath}.`,
          },
        ),
      );
    }
  } catch (error) {
    failTask(generationFailureMessage);
    command.error(error instanceof Error ? error.message : String(error));
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
      command.error(error instanceof Error ? error.message : String(error));
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
      command.error(error instanceof Error ? error.message : String(error));
    }
  }
}

export default class EnvProxy extends Command {
  static override summary = 'Generate proxy configs for one managed env through provider subcommands';
  static override description =
    'Use `nb env proxy nginx` or `nb env proxy caddy` to generate provider-specific proxy files.';

  static override examples = [
    '<%= config.bin %> env proxy nginx',
    '<%= config.bin %> env proxy nginx --env app1',
    '<%= config.bin %> env proxy nginx --env app1 --install --reload',
    '<%= config.bin %> env proxy caddy',
    '<%= config.bin %> env proxy caddy --env app1',
    '<%= config.bin %> env proxy caddy --env app1 --install --reload',
    '<%= config.bin %> env proxy caddy --env app1 --print',
  ];

  public async run(): Promise<void> {
    await this.parse(EnvProxy);
    const Help = await loadHelpClass(this.config);
    await new Help(this.config, this.config.pjson.oclif.helpOptions ?? this.config.pjson.helpOptions).showHelp([
      this.id ?? 'env proxy',
      ...this.argv,
    ]);
  }
}
