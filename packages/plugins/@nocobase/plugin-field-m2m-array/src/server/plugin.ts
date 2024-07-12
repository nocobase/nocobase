/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { BelongsToArrayField } from './belongs-to-array-field';
import { createForeignKey } from './hooks/create-foreign-key';
import { beforeDestroyForeignKey } from './hooks/before-destroy-foreign-key';
import { DataSource, SequelizeCollectionManager } from '@nocobase/data-source-manager';

export class PluginFieldM2MArrayServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    this.app.dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
      const collectionManager = dataSource.collectionManager;
      if (collectionManager instanceof SequelizeCollectionManager) {
        collectionManager.registerFieldTypes({
          belongsToArray: BelongsToArrayField,
        });
      }
    });
    this.db.on('fields.afterCreate', createForeignKey(this.db));
    this.db.on('fields.beforeDestroy', beforeDestroyForeignKey(this.db));
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginFieldM2MArrayServer;
