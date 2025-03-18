/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';
import { tokenPolicyCollectionName, tokenPolicyRecordKey } from '../../constants';
export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<1.6.1';

  async up() {
    const tokenPolicyRepo = this.app.db.getRepository(tokenPolicyCollectionName);
    const tokenPolicy = await tokenPolicyRepo.findOne({ filterByTk: tokenPolicyRecordKey });
    if (tokenPolicy) {
      this.app.authManager.tokenController.setConfig(tokenPolicy.config);
    } else {
      const config = {
        tokenExpirationTime: '1d',
        sessionExpirationTime: '7d',
        expiredTokenRenewLimit: '1d',
      };
      await tokenPolicyRepo.create({
        values: {
          key: tokenPolicyRecordKey,
          config,
        },
      });
      this.app.authManager.tokenController.setConfig(config);
    }
  }
}
