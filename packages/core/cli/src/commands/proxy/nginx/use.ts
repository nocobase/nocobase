/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command } from '@oclif/core';
import { NGINX_PROXY_DRIVER_OPTIONS, normalizeNginxProxyDriver } from '../../../lib/cli-config.js';
import { setNginxProxyDriver } from '../../../lib/proxy-nginx.js';

export default class ProxyNginxUse extends Command {
  static override summary = 'Choose whether nginx runs locally or in Docker';
  static override examples = ['<%= config.bin %> proxy nginx use local', '<%= config.bin %> proxy nginx use docker'];

  static override args = {
    driver: Args.string({
      description: 'Nginx runtime driver',
      required: true,
      options: [...NGINX_PROXY_DRIVER_OPTIONS],
    }),
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(ProxyNginxUse);
    const driver = normalizeNginxProxyDriver(args.driver);
    if (!driver) {
      this.error(`Unsupported nginx driver "${args.driver}". Use one of: ${NGINX_PROXY_DRIVER_OPTIONS.join(', ')}`);
    }

    const saved = await setNginxProxyDriver(driver);
    this.log(saved);
  }
}
