/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { DataSource, SequelizeCollectionManager } from '@nocobase/data-source-manager';

import { SortField } from './sort-field';
import { move } from './action';

export class PluginFieldSortServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {
    const { lockManager } = this.app;
    class SortFieldClass extends SortField {}
    SortFieldClass.lockManager = lockManager;
    this.app.db.registerFieldTypes({
      sort: SortFieldClass,
    });

    this.app.dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
      if (dataSource.collectionManager instanceof SequelizeCollectionManager) {
        dataSource.resourceManager.registerActionHandlers({ move });
      }
    });
  }

  async load() {}

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginFieldSortServer;
