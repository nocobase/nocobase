/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command } from '@oclif/core';
import { getCaddyProxyDriver, resolveCaddyProxyRuntimeContext, startCaddyProxy } from '../../../lib/proxy-caddy.js';
import { failTask, startTask, succeedTask } from '../../../lib/ui.js';

export default class ProxyCaddyStart extends Command {
  static override summary = 'Start the managed caddy proxy';

  public async run(): Promise<void> {
    await this.parse(ProxyCaddyStart);
    const driver = await getCaddyProxyDriver();
    const runtimeContext = await resolveCaddyProxyRuntimeContext();
    startTask(`Starting caddy proxy with the ${driver} driver...`);

    try {
      const result = await startCaddyProxy(runtimeContext);
      succeedTask(
        result === 'already-running'
          ? `Caddy proxy is already running with the ${driver} driver.`
          : `Caddy proxy started with the ${driver} driver.`,
      );
    } catch (error) {
      failTask(`Failed to start caddy proxy with the ${driver} driver.`);
      this.error(error instanceof Error ? error.message : String(error));
    }
  }
}
