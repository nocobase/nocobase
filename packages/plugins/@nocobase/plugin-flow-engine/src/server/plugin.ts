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

  // TODO: Implement permission check logic
  async hasPermission(roles: string[]) {
    return true;
    if (roles.includes('root')) {
      return true;
    }
    const r = this.db.getRepository('roles');
    const items = await r.find({
      filter: {
        name: roles,
      },
    });
    return false;
  }

  async beforeLoad() {
    this.app.acl.allow('flowSql', 'run', 'loggedIn');
    this.app.resourceManager.registerActionHandlers({
      'flowSql:run': async (ctx, next) => {
        const { uid, sql, type, params } = ctx.action.params.values || {};
        if (!uid) {
          ctx.throw(400, 'UID is required');
        }
        const roles = ctx.state.currentUser?.roles || [];
        const r = this.db.getRepository('flowSql');
        let record;
        const allowed = await this.hasPermission(roles);
        if (allowed && sql) {
          record = await r.updateOrCreate({
            filterKeys: ['uid'],
            values: {
              uid,
              sql,
            },
          });
          if (Array.isArray(record)) {
            record = record[0];
          }
        } else {
          record = await r.findOne({
            filter: {
              uid,
            },
          });
        }
        if (!record || !record.sql) {
          ctx.throw(404, 'Flow SQL not found');
        }
        const result = await this.db.sequelize.query(record.sql, {
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
