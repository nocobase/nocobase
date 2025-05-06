/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';
import { uid } from '@nocobase/utils';
import { SMS_OTP_VERIFICATION_TYPE } from '../../constants';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<1.7.0';

  async up() {
    const verificatorsRepo = this.db.getRepository('verificators');
    if (await verificatorsRepo.count()) {
      // migration already done
      return;
    }
    const repo = this.db.getRepository('verifications_providers');
    if (!repo) {
      return;
    }
    const providers = await this.db.getRepository('verifications_providers').find();
    if (!providers.length) {
      return;
    }
    const verificators = [];
    let defaultVerificator: any;
    providers.forEach((provider: any) => {
      const verificator = {
        name: `v_${uid()}`,
        title: provider.title,
        verificationType: SMS_OTP_VERIFICATION_TYPE,
        options: {
          provider: provider.type,
          settings: provider.options,
        },
      };
      verificators.push(verificator);
      if (provider.default) {
        defaultVerificator = verificator;
      }
    });
    if (!defaultVerificator) {
      defaultVerificator = verificators[0];
    }
    const smsAuth = await this.db.getRepository('authenticators').find({
      filter: {
        authType: 'SMS',
      },
    });
    await this.db.sequelize.transaction(async (transaction) => {
      const verificatorModel = this.db.getModel('verificators');
      await verificatorModel.bulkCreate(verificators, { transaction });
      for (const item of smsAuth) {
        await item.update(
          {
            options: {
              ...item.options,
              public: {
                ...item.options?.public,
                verificator: defaultVerificator?.name,
              },
            },
          },
          { transaction },
        );
      }
    });
  }
}
