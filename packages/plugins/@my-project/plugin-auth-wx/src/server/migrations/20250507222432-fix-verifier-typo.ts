/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';
import _ from 'lodash';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<1.7.0';

  async up() {
    const authenticators = await this.db.getRepository('authenticators').find({
      filter: {
        authType: 'SMS',
      },
    });
    for (const authenticator of authenticators) {
      if (authenticator.options?.public?.verificator) {
        await authenticator.update({
          options: {
            ...authenticator.options,
            public: {
              ..._.omit(authenticator.options.public, ['verificator']),
              verifier: authenticator.options.public.verificator,
            },
          },
        });
      }
    }
  }
}
