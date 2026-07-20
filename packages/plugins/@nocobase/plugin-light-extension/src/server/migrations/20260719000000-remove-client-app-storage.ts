/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { storagePathJoin } from '@nocobase/utils';
import fs from 'fs/promises';

import { snakeCase } from '@nocobase/database';
import { Migration } from '@nocobase/server';

const LEGACY_TABLES = ['lightExtensionClientAppAssets', 'lightExtensionClientApps'];
const LEGACY_STORAGE_NAME = 'light-extension-client-app-internal';

export default class extends Migration {
  on = 'afterSync';

  async up() {
    const { db } = this.context;
    await db.sequelize.transaction(async (transaction) => {
      for (const name of LEGACY_TABLES) {
        const tableName = `${db.getTablePrefix()}${db.options.underscored ? snakeCase(name) : name}`;
        const table = db.options.schema ? { tableName, schema: db.options.schema } : tableName;
        if (await this.queryInterface.tableExists(table, { transaction })) {
          await this.queryInterface.dropTable(table, { transaction });
        }
      }
      if (db.hasCollection('storages')) {
        await db.getRepository('storages').destroy({
          filter: { name: LEGACY_STORAGE_NAME },
          transaction,
        });
      }
    });
    await fs.rm(storagePathJoin('light-extension-client-app-assets'), { recursive: true, force: true });
  }
}
