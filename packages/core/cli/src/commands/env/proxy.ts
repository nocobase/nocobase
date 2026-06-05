/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Args, Command, Flags } from '@oclif/core';
import { formatMissingManagedAppEnvMessage, resolveManagedAppRuntime } from '../../lib/app-runtime.js';
import { resolveDefaultConfigScope } from '../../lib/cli-home.js';
import { translateCli } from '../../lib/cli-locale.js';
import {
  buildEnvProxyConfig,
  buildEnvProxyMainConfig,
  resolveEnvProxyMainOutputPath,
  resolveEnvProxyOutputPath,
} from '../../lib/env-proxy.js';
import { announceTargetEnv, failTask, startTask, succeedTask } from '../../lib/ui.js';

export default class EnvProxy extends Command {
  static override summary = 'Generate an nginx proxy config for one managed env';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> app1',
    '<%= config.bin %> <%= command.id %> app1 --output ./app.conf',
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
      description: 'Output file path. Defaults to ~/.nocobase/proxy/<env>/app.conf',
    }),
    print: Flags.boolean({
      description: 'Print the generated config to stdout instead of writing a file',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(EnvProxy);
    const envNameArg = args.name?.trim() || undefined;
    const envNameFlag = flags.env?.trim() || undefined;

    if (envNameArg && envNameFlag && envNameArg !== envNameFlag) {
      this.error(
        `Environment name was provided both as the argument ("${envNameArg}") and as --env ("${envNameFlag}"). Please use only one.`,
      );
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
    startTask(
      translateCli(
        'commands.envProxy.messages.generating',
        { envName: runtime.envName },
        {
          fallback: `Generating proxy config for env "${runtime.envName}"...`,
        },
      ),
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
        scope: resolveDefaultConfigScope(),
      });
      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeFile(outputPath, result.content, 'utf8');

      const shouldWriteSharedConfig = !flags.output;
      let sharedOutputPath: string | undefined;
      if (shouldWriteSharedConfig) {
        sharedOutputPath = resolveEnvProxyMainOutputPath({
          scope: resolveDefaultConfigScope(),
        });
        await mkdir(path.dirname(sharedOutputPath), { recursive: true });
        await writeFile(
          sharedOutputPath,
          buildEnvProxyMainConfig({
            scope: resolveDefaultConfigScope(),
          }),
          'utf8',
        );
      }

      succeedTask(
        translateCli(
          'commands.envProxy.messages.saved',
          { envName: runtime.envName, outputPath, sharedOutputPath },
          {
            fallback: sharedOutputPath
              ? `Saved proxy config for env "${runtime.envName}" at ${outputPath}, and updated shared nginx config at ${sharedOutputPath}.`
              : `Saved proxy config for env "${runtime.envName}" at ${outputPath}.`,
          },
        ),
      );
    } catch (error) {
      failTask(
        translateCli(
          'commands.envProxy.messages.failed',
          { envName: runtime.envName },
          {
            fallback: `Failed to generate proxy config for env "${runtime.envName}".`,
          },
        ),
      );
      this.error(error instanceof Error ? error.message : String(error));
    }
  }
}
