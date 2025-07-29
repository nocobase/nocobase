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
  params?: Record<string, any>;
  type?: 'selectVar' | 'selectRow' | 'selectRows';
};

export class PluginFlowEngineClient extends Plugin {
  async afterAdd() {}
  async beforeLoad() {}
  async load() {
    const ctx = this.flowEngine.context;
    ctx.defineMethod('runsql', async (sql: string, options: RunSQLOptions) => {
      if (!options.uid) {
        throw new Error('UID is required');
      }
      if (!sql) {
        throw new Error('SQL query cannot be empty');
      }
      const { data } = await ctx.api.request({
        method: 'POST',
        url: 'flowSql:run',
        data: {
          sql,
          type: 'selectRows',
          ..._.pick(options, ['uid', 'params', 'type']),
        },
      });
      return data?.data;
    });
  }
}

export default PluginFlowEngineClient;
