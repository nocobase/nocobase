/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import _ from 'lodash';

type RunSQLOptions = {
  uid: string;
  sql?: string;
  bind?: Record<string, any> | Array<any>;
  type?: 'selectVar' | 'selectRow' | 'selectRows';
  dataSourceKey?: string;
  filter?: Record<string, any>;
  debug?: boolean;
};

export class PluginCollectionSqlClient extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    const ctx = this.flowEngine.context;
    ctx.defineMethod('runsql', async (options: RunSQLOptions) => {
      if (!options.uid) {
        throw new Error('UID is required');
      }
      const { data } = await ctx.api.request({
        method: 'POST',
        url: 'flowSql:run',
        data: {
          type: 'selectRows',
          ..._.pick(options, ['sql', 'uid', 'bind', 'filter', 'type', 'dataSourceKey', 'debug']),
        },
      });
      return data?.data;
    });
    // this.app.addComponents({})
    // this.app.addScopes({})
    // this.app.addProvider()
    // this.app.addProviders()
    // this.app.router.add()
  }
}

export default PluginCollectionSqlClient;
