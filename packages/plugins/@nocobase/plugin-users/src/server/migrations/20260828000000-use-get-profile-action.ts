/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad';

  async up() {
    const repo = this.db.getRepository<UiSchemaRepository>('uiSchemas');
    const schema = await repo.getJsonSchema('nocobase-user-profile-edit-form');
    const formBlock = schema?.properties?.form;
    if (!formBlock?.['x-uid']) {
      return;
    }

    await repo.patch({
      'x-uid': formBlock['x-uid'],
      'x-decorator-props': {
        ...formBlock['x-decorator-props'],
        action: 'getProfile',
      },
    });
  }
}
