import path from 'path';
import Database, { registerFields, Table } from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import * as fields from './fields';
import * as usersActions from './actions/users';
import * as middlewares from './middlewares';
import Application from '@nocobase/server';

export default async function (this: Application, options = {}) {
  const database: Database = this.database;
  const resourcer: Resourcer = this.resourcer;

  registerFields(fields);

  this.on('db.init', async () => {
    const User = database.getModel('users');
    await User.create({
      nickname: '超级管理员',
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });
  });

  database.on('afterTableInit', (table: Table) => {
    let { createdBy, updatedBy } = table.getOptions();
    if (createdBy !== false) {
      table.addField({
        type: 'createdBy',
        name: typeof createdBy === 'string' ? createdBy : 'createdBy',
        target: 'users',
      });
    }
    if (updatedBy !== false) {
      table.addField({
        type: 'updatedBy',
        name: typeof updatedBy === 'string' ? updatedBy : 'updatedBy',
        target: 'users',
      });
    }
  });

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  for (const [key, action] of Object.entries(usersActions)) {
    resourcer.registerActionHandler(`users:${key}`, action);
  }

  resourcer.use(middlewares.parseToken(options));
}
