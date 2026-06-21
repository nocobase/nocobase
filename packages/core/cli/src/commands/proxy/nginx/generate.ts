/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import {
  formatMissingManagedAppEnvMessage,
  resolveManagedAppRuntime,
  type ManagedAppRuntime,
} from '../../../lib/app-runtime.js';
import {
  getNginxProxyDriver,
  normalizeProxyListenPort,
  resolveNginxProxyRuntimeContext,
  writeNginxProxyBundle,
} from '../../../lib/proxy-nginx.js';
import { announceTargetEnv, failTask, startTask, succeedTask } from '../../../lib/ui.js';

type WritableProxyRuntime = Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>;

export default class ProxyNginxGenerate extends Command {
  static override summary = 'Generate nginx proxy files for one managed env';
  static override examples = [
    '<%= config.bin %> proxy nginx generate --env app1 --host app1.example.com',
    '<%= config.bin %> proxy nginx generate --env app1 --host app1.example.com --port 8080',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name to generate proxy files for',
      required: true,
    }),
    host: Flags.string({
      description: 'Host exposed by the nginx entry config, such as example.com or localhost',
    }),
    port: Flags.string({
      description: 'Port exposed by the nginx entry config, not the upstream NocoBase app port',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(ProxyNginxGenerate);
    const requestedEnv = flags.env?.trim() || undefined;
    const requestedPort = flags.port?.trim() || undefined;
    const normalizedPort = normalizeProxyListenPort(requestedPort);

    if (requestedPort && !normalizedPort) {
      this.error(`Invalid proxy entry port "${requestedPort}". Use an integer between 1 and 65535.`);
    }

    const runtime = await resolveManagedAppRuntime(requestedEnv);
    if (!runtime) {
      this.error(formatMissingManagedAppEnvMessage(requestedEnv));
    }

    if (runtime.kind === 'http') {
      this.error(
        `Can't generate an nginx proxy config for "${runtime.envName}" from this machine because the env only has an API connection.`,
      );
    }

    if (runtime.kind === 'ssh') {
      this.error(
        `Can't generate an nginx proxy config for "${runtime.envName}" yet because SSH envs are not implemented.`,
      );
    }

    const driver = await getNginxProxyDriver();
    const runtimeContext = await resolveNginxProxyRuntimeContext();
    announceTargetEnv(runtime.envName);
    startTask(`Generating nginx proxy config for env "${runtime.envName}" with the ${driver} driver...`);

    try {
      const { bundle, status } = await writeNginxProxyBundle(
        runtime as WritableProxyRuntime,
        {
          host: flags.host?.trim() || undefined,
          port: normalizedPort,
        },
        runtimeContext,
      );
      succeedTask(
        status === 'created'
          ? `Saved nginx proxy files for env "${runtime.envName}" under ${bundle.entryDir}, and created editable app entry config at ${bundle.appConfigPath}.`
          : `Saved nginx proxy files for env "${runtime.envName}" under ${bundle.entryDir}, and refreshed editable app entry config at ${bundle.appConfigPath}.`,
      );
    } catch (error) {
      failTask(`Failed to generate nginx proxy config for env "${runtime.envName}".`);
      this.error(error instanceof Error ? error.message : String(error));
    }
  }
}
