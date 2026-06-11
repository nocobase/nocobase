/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command } from '@oclif/core';
import { getCliConfigValue } from '../../../lib/cli-config.js';
import {
  mapProxyPathFromCliRoot,
  resolveEnvProxyMainOutputPath,
  resolveEnvProxyNginxSnippetsOutputDir,
} from '../../../lib/env-proxy.js';
import {
  formatNginxProxyInfoLines,
  resolveNginxProxyContainerName,
  resolveNginxProxyImage,
  resolveNginxProxyRuntimeContext,
} from '../../../lib/proxy-nginx.js';

export default class ProxyNginxInfo extends Command {
  static override summary = 'Show current nginx proxy driver and generated path info';

  public async run(): Promise<void> {
    await this.parse(ProxyNginxInfo);
    const runtimeContext = await resolveNginxProxyRuntimeContext();
    const lines = formatNginxProxyInfoLines({
      driver: runtimeContext.driver,
      configFile: await mapProxyPathFromCliRoot(resolveEnvProxyMainOutputPath(), {
        runtimeCliRoot: runtimeContext.runtimeCliRoot,
      }),
      snippetsDir: await mapProxyPathFromCliRoot(resolveEnvProxyNginxSnippetsOutputDir(), {
        runtimeCliRoot: runtimeContext.runtimeCliRoot,
      }),
      upstreamHost: runtimeContext.upstreamHost,
      nginxBinary: await getCliConfigValue('bin.nginx'),
      runtimeRoot: runtimeContext.runtimeCliRoot,
      containerName: await resolveNginxProxyContainerName(),
      image: resolveNginxProxyImage(),
    });
    this.log(lines.join('\n'));
  }
}
