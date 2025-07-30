/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';

export class PluginFlowEngineServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {
    this.app.acl.allow('flowSql', 'run', 'loggedIn');
    this.app.resourceManager.registerActionHandlers({
      'flowSql:run': async (ctx, next) => {
        const { uid, sql, type, params } = ctx.action.params.values || {};
        const result = await this.db.sequelize.query(sql, {
          replacements: params,
        });
        if (type === 'selectVar') {
          ctx.body = Object.values(result[0][0] || {}).shift();
          return;
        }
        if (type === 'selectRow') {
          ctx.body = result[0][0] || null;
          return;
        }
        if (type === 'selectRows') {
          ctx.body = result[0] || [];
          return;
        }
        await next();
      },
    });
  }

  async load() {}

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginFlowEngineServer;
