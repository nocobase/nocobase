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
  writeManualNginxProxyBundle,
  writeNginxProxyBundle,
} from '../../../lib/proxy-nginx.js';
import { announceTargetEnv, failTask, startTask, succeedTask } from '../../../lib/ui.js';

type WritableProxyRuntime = Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>;

export default class ProxyNginxGenerate extends Command {
  static override summary = 'Generate nginx proxy files for one managed env';
  static override examples = [
    '<%= config.bin %> proxy nginx generate --host app1.example.com',
    '<%= config.bin %> proxy nginx generate --env app1 --host app1.example.com',
    '<%= config.bin %> proxy nginx generate --env app1 --host app1.example.com --port 8080',
    '<%= config.bin %> proxy nginx generate --manual --name default --app-port 13000 --storage-path /path/to/storage --dist-root-path /path/to/dist-client --runtime-version 2.1.0',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name to generate proxy files for. Defaults to the current env when omitted',
    }),
    manual: Flags.boolean({
      description: 'Generate proxy files from explicit runtime flags instead of a saved env',
      default: false,
    }),
    name: Flags.string({
      description: 'Output bundle name used under .nocobase/proxy/nginx in manual mode',
    }),
    'app-port': Flags.string({
      description: 'Upstream NocoBase app port in manual mode',
    }),
    'storage-path': Flags.string({
      description: 'Path to the NocoBase storage directory in manual mode',
    }),
    'dist-root-path': Flags.string({
      description:
        'Path to the dist-client root directory used to generate index-v1.html and index-v2.html in manual mode',
    }),
    'runtime-version': Flags.string({
      description: 'Frontend runtime version under dist-root-path in manual mode',
    }),
    'app-public-path': Flags.string({
      description: 'Public base path served by the proxied app in manual mode. Defaults to /',
    }),
    'upstream-host': Flags.string({
      description: 'Upstream host used by nginx proxy_pass in manual mode',
    }),
    'cdn-base-url': Flags.string({
      description: 'Client asset CDN base URL used when generating runtime HTML',
    }),
    force: Flags.boolean({
      description: 'Overwrite existing app.conf even when the managed block is missing',
      default: false,
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
    const manual = Boolean(flags.manual);

    if (requestedPort && !normalizedPort) {
      this.error(`Invalid proxy entry port "${requestedPort}". Use an integer between 1 and 65535.`);
    }

    if (manual && requestedEnv) {
      this.error('`--manual` cannot be combined with `--env`.');
    }

    if (manual) {
      const name = flags.name?.trim() || undefined;
      const requestedAppPort = flags['app-port']?.trim() || undefined;
      const appPort = normalizeProxyListenPort(requestedAppPort);
      const storagePath = flags['storage-path']?.trim() || undefined;
      const distRootPath = flags['dist-root-path']?.trim() || undefined;
      const runtimeVersion = flags['runtime-version']?.trim() || undefined;

      if (requestedAppPort && !appPort) {
        this.error(`Invalid manual app port "${requestedAppPort}". Use an integer between 1 and 65535.`);
      }

      if (!name || !appPort || !storagePath || !distRootPath || !runtimeVersion) {
        this.error(
          'Manual mode requires `--name`, `--app-port`, `--storage-path`, `--dist-root-path`, and `--runtime-version`.',
        );
      }

      const driver = await getNginxProxyDriver();
      const runtimeContext = await resolveNginxProxyRuntimeContext();
      announceTargetEnv(name);
      startTask(`Generating nginx proxy config for env "${name}" with the ${driver} driver...`);

      try {
        const { bundle, status } = await writeManualNginxProxyBundle(
          {
            name,
            appPort,
            storagePath,
            distRootPath,
            runtimeVersion,
            appPublicPath: flags['app-public-path']?.trim() || undefined,
            upstreamHost: flags['upstream-host']?.trim() || undefined,
            cdnBaseUrl: flags['cdn-base-url']?.trim() || undefined,
          },
          {
            host: flags.host?.trim() || undefined,
            port: normalizedPort,
          },
          runtimeContext,
          {
            force: flags.force,
          },
        );
        succeedTask(
          status === 'created'
            ? `Saved nginx proxy files for env "${name}" under ${bundle.entryDir}, and created editable app entry config at ${bundle.appConfigPath}.`
            : `Saved nginx proxy files for env "${name}" under ${bundle.entryDir}, and refreshed editable app entry config at ${bundle.appConfigPath}.`,
        );
      } catch (error) {
        failTask(`Failed to generate nginx proxy config for env "${name}".`);
        this.error(error instanceof Error ? error.message : String(error));
      }

      return;
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
        {
          cdnBaseUrl: flags['cdn-base-url']?.trim() || undefined,
          force: flags.force,
        },
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
