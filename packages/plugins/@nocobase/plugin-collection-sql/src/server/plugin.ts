/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { Collection } from '@nocobase/database';
import { SQLCollection } from './sql-collection';
import sqlResourcer from './resources/sql';

export class PluginCollectionSQLServer extends Plugin {
  async beforeLoad() {
    this.app.db.collectionFactory.registerCollectionType(SQLCollection, {
      condition: (options) => {
        return options.sql;
      },

      async onSync() {
        return;
      },

      async onDump(dumper, collection: Collection) {
        return;
      },
    });

    this.app.resourceManager.define(sqlResourcer);

    this.app.acl.registerSnippet({
      name: `pm.data-source-manager.collection-sql `,
      actions: ['sqlCollection:*'],
    });
  }
}

export default PluginCollectionSQLServer;
