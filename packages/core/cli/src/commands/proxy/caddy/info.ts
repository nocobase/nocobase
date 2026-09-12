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
import { mapProxyPathFromCliRoot, resolveEnvProxyMainOutputPath } from '../../../lib/env-proxy.js';
import {
  formatCaddyProxyInfoLines,
  resolveCaddyProxyContainerName,
  resolveCaddyProxyImage,
  resolveCaddyProxyRuntimeContext,
} from '../../../lib/proxy-caddy.js';

export default class ProxyCaddyInfo extends Command {
  static override summary = 'Show current caddy proxy driver and generated path info';

  public async run(): Promise<void> {
    await this.parse(ProxyCaddyInfo);
    const runtimeContext = await resolveCaddyProxyRuntimeContext();
    const lines = formatCaddyProxyInfoLines({
      driver: runtimeContext.driver,
      configFile: await mapProxyPathFromCliRoot(resolveEnvProxyMainOutputPath({ provider: 'caddy' }), {
        runtimeCliRoot: runtimeContext.runtimeCliRoot,
      }),
      upstreamHost: runtimeContext.upstreamHost,
      caddyBinary: await getCliConfigValue('bin.caddy'),
      runtimeRoot: runtimeContext.runtimeCliRoot,
      containerName: await resolveCaddyProxyContainerName(),
      image: resolveCaddyProxyImage(),
    });
    this.log(lines.join('\n'));
  }
}
