/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { RecordSetField } from './record-set-field';

export class PluginFieldRecordSetServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    this.db.registerFieldTypes({
      recordSet: RecordSetField,
    });
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginFieldRecordSetServer;
