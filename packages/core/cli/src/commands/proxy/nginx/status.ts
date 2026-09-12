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
  formatNginxProxyStatusLines,
  getNginxProxyStatus,
  resolveNginxProxyRuntimeContext,
} from '../../../lib/proxy-nginx.js';

export default class ProxyNginxStatus extends Command {
  static override summary = 'Show the current nginx proxy runtime status';

  public async run(): Promise<void> {
    await this.parse(ProxyNginxStatus);
    const runtimeContext = await resolveNginxProxyRuntimeContext();
    const status = await getNginxProxyStatus(runtimeContext);
    this.log(formatNginxProxyStatusLines(status).join('\n'));
  }
}
