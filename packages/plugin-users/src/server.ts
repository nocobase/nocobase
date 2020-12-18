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

export default async function (options = {}) {
  const database: Database = this.database;
  const resourcer: Resourcer = this.resourcer;

  registerFields(fields);

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  database.addHook('afterTableInit', (table) => {
    const { createdBy, updatedBy } = table.getOptions();
    const fieldsToMake = { createdBy, updatedBy };
    Object.keys(fieldsToMake)
      .filter(type => Boolean(fieldsToMake[type]))
      .map(type => table.addField(makeOptions(type, fieldsToMake[type])));
  });

  // hooks.call(this);

  resourcer.registerActionHandlers({
    'users:login': login,
    'users:register': register,
    'users:logout': logout,
    'users:check': check,
  });

  resourcer.import({
    directory: path.resolve(__dirname, 'resources'),
  });
}
