/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core';
import { formatMissingManagedAppEnvMessage, resolveManagedAppRuntime } from '../../lib/app-runtime.js';
import { getCurrentEnvName, listEnvs } from '../../lib/auth-store.js';
import { resolveDefaultConfigScope } from '../../lib/cli-home.js';
import { translateCli } from '../../lib/cli-locale.js';
import { renderTable } from '../../lib/ui.js';
import { apiStatus, runtimeStatus } from './shared.js';

type EnvStatusJsonRow = {
  env: string;
  status: string;
  apiBaseUrl: string;
};

export default class EnvStatus extends Command {
  static override summary = 'Show application runtime status for the current env, one env, or all envs';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> app1',
    '<%= config.bin %> <%= command.id %> --all',
    '<%= config.bin %> <%= command.id %> --all --json-output',
  ];

  static override args = {
    name: Args.string({
      description:
        'Configured environment name to inspect. Defaults to the current env when omitted; cannot be used with --all',
      required: false,
    }),
  };

  static override flags = {
    all: Flags.boolean({
      description: 'Show status for all configured envs',
      default: false,
    }),
    'json-output': Flags.boolean({
      description: 'Output the result as JSON',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(EnvStatus);
    const scope = resolveDefaultConfigScope();
    const requestedEnv = args.name?.trim() || undefined;

    if (requestedEnv && flags.all) {
      this.error('`nb env status <name>` and `nb env status --all` cannot be used together.');
    }

    const { envs } = await listEnvs({ scope });
    const configuredEnvNames = Object.keys(envs).sort();

    if (!configuredEnvNames.length) {
      this.log(translateCli('commands.env.messages.noEnvsConfigured'));
      this.log(translateCli('commands.env.messages.noEnvsConfiguredHelp'));
      return;
    }

    const envNames = flags.all ? configuredEnvNames : [requestedEnv || (await getCurrentEnvName({ scope }))];

    const rows: EnvStatusJsonRow[] = [];
    for (const envName of envNames) {
      const runtime = await resolveManagedAppRuntime(envName);
      if (!runtime) {
        if (!flags.all) {
          this.error(formatMissingManagedAppEnvMessage(envName));
        }

        rows.push({
          env: envName,
          status: 'missing',
          apiBaseUrl: '',
        });
        continue;
      }

      const status =
        runtime.kind === 'http' || runtime.kind === 'ssh'
          ? await apiStatus(
              envName,
              {
                ...envs[envName],
                ...(runtime.env.config ?? {}),
              },
              { scope },
            )
          : await runtimeStatus(runtime);

      rows.push({
        env: runtime.envName,
        status,
        apiBaseUrl:
          runtime.env.apiBaseUrl ||
          String(
            runtime.env.config.apiBaseUrl ??
              runtime.env.config.baseUrl ??
              envs[envName]?.apiBaseUrl ??
              envs[envName]?.baseUrl ??
              '',
          ).trim(),
      });
    }

    if (flags['json-output']) {
      this.log(JSON.stringify(flags.all ? rows : rows[0], null, 2));
      return;
    }

    const tableRows = rows.map((row) => [row.env, row.status, row.apiBaseUrl]);
    this.log(renderTable(['Env', 'Status', 'API Base URL'], tableRows));
  }
}
