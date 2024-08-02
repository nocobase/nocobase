/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionManager, DataSource } from '@nocobase/data-source-manager';
import { waitSecond } from '@nocobase/test';

export class MockDataSource extends DataSource {
  static testConnection(options?: any): Promise<boolean> {
    return Promise.resolve(true);
  }

  async load(): Promise<void> {
    await waitSecond(1000);
  }

  createCollectionManager(options?: any): any {
    return new CollectionManager(options);
  }
}
