/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataSource } from './data-source';
import { SequelizeCollectionManager } from './sequelize-collection-manager';

export class SequelizeDataSource extends DataSource {
  createCollectionManager(options?: any) {
    return new SequelizeCollectionManager(options.collectionManager);
  }
}
