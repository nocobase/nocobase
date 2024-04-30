/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model } from '@nocobase/database';
import { Migration } from '@nocobase/server';

export default class extends Migration {
  appVersion = '<0.17.0-alpha.8';
  async up() {
    const result = await this.app.version.satisfies('<0.17.0-alpha.8');
    if (!result) {
      return;
    }
    const systemSettings = this.db.getRepository('systemSettings');
    const instance: Model = await systemSettings.findOne();
    if (!instance?.options?.mobileSchemaUid) {
      return;
    }
    const UiSchemas = this.db.getModel('uiSchemas');
    await this.db.sequelize.transaction(async (transaction) => {
      await UiSchemas.update(
        {
          'x-uid': 'nocobase-mobile-container',
        },
        {
          transaction,
          where: {
            'x-uid': instance?.options?.mobileSchemaUid,
          },
        },
      );
      await this.db.getModel('uiSchemaTreePath').update(
        {
          descendant: 'nocobase-mobile-container',
        },
        {
          transaction,
          where: {
            descendant: instance?.options?.mobileSchemaUid,
          },
        },
      );
      await this.db.getModel('uiSchemaTreePath').update(
        {
          ancestor: 'nocobase-mobile-container',
        },
        {
          transaction,
          where: {
            ancestor: instance?.options?.mobileSchemaUid,
          },
        },
      );
    });
    console.log(instance?.options?.mobileSchemaUid);
  }
}
