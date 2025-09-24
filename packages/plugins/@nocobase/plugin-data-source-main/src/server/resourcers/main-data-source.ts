/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import PluginDataSourceMainServer from '../server';
import { MainDataSource } from '@nocobase/server';

export default {
  name: 'mainDataSource',
  actions: {
    async refresh(ctx: Context, next: Next) {
      const plugin = ctx.app.pm.get('data-source-main') as PluginDataSourceMainServer;
      const mainDataSource = ctx.app.dataSourceManager.get('main') as MainDataSource;
      if (mainDataSource.status === 'loaded') {
        await plugin.loadCollections();
      }
      await next();
    },

    async syncFields(ctx: Context, next: Next) {
      const { collections } = ctx.action.params.values || {};
      const mainDataSource = ctx.app.dataSourceManager.get('main') as MainDataSource;
      if (mainDataSource.status === 'loaded') {
        await mainDataSource.syncFieldsFromDatabase(ctx, collections);
      }
      await next();
    },
  },
};
