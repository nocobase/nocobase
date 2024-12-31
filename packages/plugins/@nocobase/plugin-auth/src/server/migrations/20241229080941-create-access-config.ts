/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';
import { tokenControlConfigCollectionName, tokenControlConfigKey } from '../../constants';
export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<1.6.1-alpha.7';

  async up() {
    const accessConfigRepository = this.app.db.getRepository(tokenControlConfigCollectionName);
    const res = await accessConfigRepository.findOne({ filterByTk: tokenControlConfigKey });
    if (res) {
      this.app.authManager.accessController.setConfig(res.config);
    } else {
      const config = {
        tokenExpirationTime: process.env.JWT_EXPIRES_IN ?? '6h',
        maxTokenLifetime: '1d',
        maxInactiveInterval: '3h',
      };
      await accessConfigRepository.create({
        values: {
          key: tokenControlConfigKey,
          config,
        },
      });
      this.app.authManager.accessController.setConfig(config);
    }
  }
}
