/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command } from '@oclif/core';
import { getCaddyProxyDriver } from '../../../lib/proxy-caddy.js';

export default class ProxyCaddyCurrent extends Command {
  static override summary = 'Print the current caddy runtime driver';

  public async run(): Promise<void> {
    await this.parse(ProxyCaddyCurrent);
    this.log(await getCaddyProxyDriver());
  }
}
