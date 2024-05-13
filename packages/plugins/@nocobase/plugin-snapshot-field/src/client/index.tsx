/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { SnapshotFieldProvider } from './SnapshotFieldProvider';
import {
  snapshotBlockInitializers,
  snapshotBlockInitializers_deprecated,
} from './SnapshotBlock/SnapshotBlockInitializers/SnapshotBlockInitializers';
import { SnapshotFieldInterface } from './interface';

export class PluginSnapshotFieldClient extends Plugin {
  async load() {
    this.app.use(SnapshotFieldProvider);
    this.app.schemaInitializerManager.add(snapshotBlockInitializers_deprecated);
    this.app.schemaInitializerManager.add(snapshotBlockInitializers);
    this.app.dataSourceManager.addFieldInterfaces([SnapshotFieldInterface]);
  }
}

export default PluginSnapshotFieldClient;
