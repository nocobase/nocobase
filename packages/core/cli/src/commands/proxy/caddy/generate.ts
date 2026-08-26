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
  getCaddyProxyDriver,
  writeCaddyProxyBundle,
  resolveCaddyProxyRuntimeContext,
} from '../../../lib/proxy-caddy.js';
import { normalizeProxyListenPort } from '../../../lib/proxy-nginx.js';
import { announceTargetEnv, failTask, startTask, succeedTask } from '../../../lib/ui.js';

type WritableProxyRuntime = Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>;

export default class ProxyCaddyGenerate extends Command {
  static override summary = 'Generate caddy proxy files for one managed env';
  static override examples = [
    '<%= config.bin %> proxy caddy generate --env app1 --host app1.example.com',
    '<%= config.bin %> proxy caddy generate --env app1 --host app1.example.com --port 8080',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name to generate proxy files for',
      required: true,
    }),
    host: Flags.string({
      description: 'Host exposed by the caddy site block, such as example.com or localhost',
    }),
    port: Flags.string({
      description: 'Port exposed by the caddy site block, not the upstream NocoBase app port',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(ProxyCaddyGenerate);
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
        `Can't generate a caddy proxy config for "${runtime.envName}" from this machine because the env only has an API connection.`,
      );
    }

    if (runtime.kind === 'ssh') {
      this.error(
        `Can't generate a caddy proxy config for "${runtime.envName}" yet because SSH envs are not implemented.`,
      );
    }

    const driver = await getCaddyProxyDriver();
    const runtimeContext = await resolveCaddyProxyRuntimeContext();
    announceTargetEnv(runtime.envName);
    startTask(`Generating caddy proxy config for env "${runtime.envName}" with the ${driver} driver...`);

    try {
      const { bundle, status } = await writeCaddyProxyBundle(
        runtime as WritableProxyRuntime,
        {
          host: flags.host?.trim() || undefined,
          port: normalizedPort,
        },
        runtimeContext,
      );
      succeedTask(
        status === 'created'
          ? `Saved caddy proxy files for env "${runtime.envName}" under ${bundle.entryDir}, and created app.caddy at ${bundle.appConfigPath}.`
          : `Saved caddy proxy files for env "${runtime.envName}" under ${bundle.entryDir}, and refreshed app.caddy at ${bundle.appConfigPath}.`,
      );
    } catch (error) {
      failTask(`Failed to generate caddy proxy config for env "${runtime.envName}".`);
      this.error(error instanceof Error ? error.message : String(error));
    }
  }
}
