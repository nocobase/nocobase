/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command } from '@oclif/core';
import { getNginxProxyDriver, resolveNginxProxyRuntimeContext, startNginxProxy } from '../../../lib/proxy-nginx.js';
import { failTask, startTask, succeedTask } from '../../../lib/ui.js';

export default class ProxyNginxStart extends Command {
  static override summary = 'Start the managed nginx proxy';

  public async run(): Promise<void> {
    await this.parse(ProxyNginxStart);
    const driver = await getNginxProxyDriver();
    const runtimeContext = await resolveNginxProxyRuntimeContext();
    startTask(`Starting nginx proxy with the ${driver} driver...`);

    try {
      const result = await startNginxProxy(runtimeContext);
      succeedTask(
        result === 'already-running'
          ? `Nginx proxy is already running with the ${driver} driver.`
          : `Nginx proxy started with the ${driver} driver.`,
      );
    } catch (error) {
      failTask(`Failed to start nginx proxy with the ${driver} driver.`);
      this.error(error instanceof Error ? error.message : String(error));
    }
  }
}
