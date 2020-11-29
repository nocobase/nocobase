import path from 'path';
import Database from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import login from './actions/login';
import register from './actions/register';
import logout from './actions/logout';
import check from './actions/check';

export default async function (options = {}) {
  const database: Database = this.database;
  const resourcer: Resourcer = this.resourcer;

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  resourcer.registerHandlers({
    'users:login': login,
    'users:register': register,
    'users:logout': logout,
    'users:check': check,
  });

  resourcer.import({
    directory: path.resolve(__dirname, 'resources'),
  });
}
