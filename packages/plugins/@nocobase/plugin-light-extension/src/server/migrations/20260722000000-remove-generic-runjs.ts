/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';

import { GenericRunJSHardDeleteMigrationService } from '../services/GenericRunJSHardDeleteMigrationService';

export default class extends Migration {
  on = 'afterSync';

  async up(): Promise<void> {
    await new GenericRunJSHardDeleteMigrationService(this.context.db).migrate();
  }
}
