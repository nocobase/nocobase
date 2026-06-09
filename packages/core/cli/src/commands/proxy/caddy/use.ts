/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command } from '@oclif/core';
import { CADDY_PROXY_DRIVER_OPTIONS, type CaddyProxyDriver } from '../../../lib/cli-config.js';
import { setCaddyProxyDriver } from '../../../lib/proxy-caddy.js';

export default class ProxyCaddyUse extends Command {
  static override summary = 'Select the caddy runtime driver';
  static override args = {
    driver: Args.string({
      description: 'caddy runtime driver',
      options: [...CADDY_PROXY_DRIVER_OPTIONS],
      required: true,
    }),
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(ProxyCaddyUse);
    const driver = await setCaddyProxyDriver(args.driver as CaddyProxyDriver);
    this.log(driver);
  }
}
