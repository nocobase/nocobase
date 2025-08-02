/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SequelizeCollectionManager } from '@nocobase/data-source-manager';
import { Collection } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import sqlResourcer from './resources/sql';
import { SQLCollection, SQLModel } from './sql-collection';
import { checkSQL } from './utils';

export class PluginCollectionSQLServer extends Plugin {
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
        const {
          uid,
          sql,
          type = 'selectRows',
          filter,
          bind,
          dataSourceKey = 'main',
          debug,
        } = ctx.action.params.values || {};
        if (!uid && !debug) {
          ctx.throw(400, 'UID is required');
        }
        const dataSource = this.app.dataSourceManager.get(dataSourceKey);
        const cm = dataSource.collectionManager as SequelizeCollectionManager;
        if (!cm.db) {
          ctx.throw(400, 'dataSourceKey is not valid');
        }
        const roles = ctx.state.currentUser?.roles || [];
        const r = this.db.getRepository('flowSql');
        let record;
        const allowed = await this.hasPermission(roles);
        if (allowed && sql) {
          if (debug) {
            record = { sql };
          } else {
            record = await r.updateOrCreate({
              filterKeys: ['uid'],
              values: {
                uid,
                sql,
              },
            });
          }
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
        let whereSQL = '';
        if (filter) {
          let where = {};
          const tmpCollection = new SQLCollection({ name: 'tmp', sql: record.sql }, { database: cm.db });
          const r = tmpCollection.repository;
          where = r.buildQueryOptions({ filter }).where;
          const queryGenerator = cm.db.sequelize.getQueryInterface().queryGenerator as any;
          const wSQL = queryGenerator.getWhereConditions(where, null, null, { bindParam: true });
          if (wSQL) {
            const hasWhere = /\bwhere\b/i.test(record.sql);
            if (hasWhere) {
              whereSQL = ` AND ${wSQL}`;
            } else {
              whereSQL = ` WHERE ${wSQL}`;
            }
          }
        }
        const result = await cm.db.sequelize.query(record.sql + whereSQL, { bind });
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
    this.app.db.collectionFactory.registerCollectionType(SQLCollection, {
      condition: (options) => {
        return options.sql;
      },

      async onSync() {
        return;
      },

      async onDump(dumper, collection: Collection) {
        return;
      },
    });

    this.app.resourceManager.define(sqlResourcer);

    this.app.acl.registerSnippet({
      name: `pm.data-source-manager.collection-sql `,
      actions: ['sqlCollection:*'],
    });

    this.app.resourceManager.use(async (ctx, next) => {
      const { resourceName, actionName } = ctx.action;
      if (resourceName === 'collections' && actionName === 'create') {
        const { sql } = ctx.action.params.values || {};
        if (sql) {
          try {
            checkSQL(sql);
          } catch (e) {
            ctx.throw(400, ctx.t(e.message));
          }
        }
      }
      return next();
    });
  }
}

export default PluginCollectionSQLServer;
