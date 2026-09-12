/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command } from '@oclif/core';
import {
  formatCaddyProxyStatusLines,
  getCaddyProxyStatus,
  resolveCaddyProxyRuntimeContext,
} from '../../../lib/proxy-caddy.js';

export default class ProxyCaddyStatus extends Command {
  static override summary = 'Show the current caddy proxy runtime status';

  public async run(): Promise<void> {
    await this.parse(ProxyCaddyStatus);
    const runtimeContext = await resolveCaddyProxyRuntimeContext();
    const status = await getCaddyProxyStatus(runtimeContext);
    this.log(formatCaddyProxyStatusLines(status).join('\n'));
  }
}
