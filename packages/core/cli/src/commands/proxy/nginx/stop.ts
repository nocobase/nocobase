/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command } from '@oclif/core';
import { getNginxProxyDriver, resolveNginxProxyRuntimeContext, stopNginxProxy } from '../../../lib/proxy-nginx.js';
import { failTask, startTask, succeedTask } from '../../../lib/ui.js';

export default class ProxyNginxStop extends Command {
  static override summary = 'Stop the managed nginx proxy';

  public async run(): Promise<void> {
    await this.parse(ProxyNginxStop);
    const driver = await getNginxProxyDriver();
    const runtimeContext = await resolveNginxProxyRuntimeContext();
    startTask(`Stopping nginx proxy with the ${driver} driver...`);

    try {
      const result = await stopNginxProxy(runtimeContext);
      succeedTask(
        result === 'already-stopped'
          ? `Nginx proxy is already stopped with the ${driver} driver.`
          : `Nginx proxy stopped with the ${driver} driver.`,
      );
    } catch (error) {
      failTask(`Failed to stop nginx proxy with the ${driver} driver.`);
      this.error(error instanceof Error ? error.message : String(error));
    }
  }
}
