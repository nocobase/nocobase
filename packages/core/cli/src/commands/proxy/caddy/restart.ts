/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command } from '@oclif/core';
import { getCaddyProxyDriver, resolveCaddyProxyRuntimeContext, restartCaddyProxy } from '../../../lib/proxy-caddy.js';
import { failTask, startTask, succeedTask } from '../../../lib/ui.js';

export default class ProxyCaddyRestart extends Command {
  static override summary = 'Restart the managed caddy proxy';

  public async run(): Promise<void> {
    await this.parse(ProxyCaddyRestart);
    const driver = await getCaddyProxyDriver();
    const runtimeContext = await resolveCaddyProxyRuntimeContext();
    startTask(`Restarting caddy proxy with the ${driver} driver...`);

    try {
      await restartCaddyProxy(runtimeContext);
      succeedTask(`Caddy proxy restarted with the ${driver} driver.`);
    } catch (error) {
      failTask(`Failed to restart caddy proxy with the ${driver} driver.`);
      this.error(error instanceof Error ? error.message : String(error));
    }
  }
}
