/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command } from '@oclif/core';
import { getNginxProxyDriver } from '../../../lib/proxy-nginx.js';

export default class ProxyNginxCurrent extends Command {
  static override summary = 'Print the current nginx runtime driver';

  public async run(): Promise<void> {
    await this.parse(ProxyNginxCurrent);
    const driver = await getNginxProxyDriver();
    this.log(driver);
  }
}
