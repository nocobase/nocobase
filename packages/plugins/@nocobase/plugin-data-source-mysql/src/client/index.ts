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
import { mysqlFormSchema } from './form-schema';

export class PluginDataSourceMySqlClient extends Plugin {
  async load() {
    const dsManager = this.app.pluginManager.get<PluginDataSourceManagerClient>('data-source-manager');
    dsManager.registerType('mysql', {
      title: 'MySQL',
      schema: mysqlFormSchema,
    });
  }
}

export default PluginDataSourceMySqlClient;
