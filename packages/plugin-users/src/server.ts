import path from 'path';

import Database, { registerFields } from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';

import * as fields from './fields';
// import hooks from './hooks';
import login from './actions/login';
import register from './actions/register';
import logout from './actions/logout';
import check from './actions/check';
import { makeOptions } from './hooks/collection-after-create';
import * as middlewares from './middlewares';

export default async function (options = {}) {
  const database: Database = this.database;
  const resourcer: Resourcer = this.resourcer;

  registerFields(fields);

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  database.addHook('afterTableInit', (table) => {
    let { createdBy, updatedBy, internal } = table.getOptions();
    // 非内置表，默认创建 createdBy 和 updatedBy
    if (!internal) {
      if (typeof createdBy === 'undefined') {
        createdBy = true;
      }
      if (typeof updatedBy === 'undefined') {
        updatedBy = true;
      }
    }
    const fieldsToMake = { createdBy, updatedBy };
    Object.keys(fieldsToMake)
      .filter(type => Boolean(fieldsToMake[type]))
      .map(type => table.addField(makeOptions(type, fieldsToMake[type])));
  });

  resourcer.registerActionHandlers({
    'users:login': login,
    'users:register': register,
    'users:logout': logout,
    'users:check': check,
  });

  resourcer.use(middlewares.parseToken(options));
}
