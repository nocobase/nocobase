/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { PluginDataSourceManagerClient } from '@nocobase/plugin-data-source-manager/client';
import { oracleFormSchema } from './form-schema';

export class PluginDataSourceOracleClient extends Plugin {
  async load() {
    const dsManager = this.app.getPlugin<PluginDataSourceManagerClient>('data-source-manager');
    dsManager.registerType('oracle', {
      title: 'Oracle',
      schema: oracleFormSchema,
    });
  }
}

export default PluginDataSourceOracleClient;
