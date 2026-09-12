/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { listEnvs } from '../../../lib/auth-store.js';
import { resolveManagedAppRuntime } from '../../../lib/app-runtime.js';
import { renderTable } from '../../../lib/ui.js';
import { ensureManagedAutostartRuntime, isAutostartEnabled } from './shared.js';

type AutostartRunResult = {
  env: string;
  status: 'started' | 'failed' | 'skipped';
  detail: string;
};

function formatSummary(results: AutostartRunResult[]): string {
  return renderTable(
    ['Env', 'Status', 'Detail'],
    results.map((result) => [result.env, result.status, result.detail]),
  );
}

export default class AppAutostartRun extends Command {
  static override description = 'Start every env that has app autostart enabled.';

  static override examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> <%= command.id %> --verbose'];

  static override flags = {
    verbose: Flags.boolean({
      description: 'Show raw startup output from the underlying local or Docker command',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(AppAutostartRun);
    const { envs } = await listEnvs();
    const enabledNames = Object.keys(envs)
      .filter((name) => isAutostartEnabled(envs[name]))
      .sort((left, right) => left.localeCompare(right));

    if (!enabledNames.length) {
      this.log('No environments have app autostart enabled.');
      return;
    }

    const results: AutostartRunResult[] = [];
    for (const envName of enabledNames) {
      const env = envs[envName];
      try {
        ensureManagedAutostartRuntime({ ...env, name: envName });
      } catch (error) {
        results.push({
          env: envName,
          status: 'skipped',
          detail: error instanceof Error ? error.message : String(error),
        });
        continue;
      }

      const runtime = await resolveManagedAppRuntime(envName);
      if (!runtime) {
        results.push({
          env: envName,
          status: 'failed',
          detail: 'Env configuration could not be resolved.',
        });
        continue;
      }

      try {
        const argv = ['--env', envName, '--yes'];
        if (flags.verbose) {
          argv.push('--verbose');
        }
        await this.config.runCommand('app:start', argv);
        results.push({
          env: envName,
          status: 'started',
          detail: `Started ${runtime.kind} app runtime.`,
        });
      } catch (error) {
        results.push({
          env: envName,
          status: 'failed',
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    }

    this.log(formatSummary(results));

    if (results.some((result) => result.status === 'failed')) {
      this.error('Some app autostart envs failed to start.');
    }
  }
}
