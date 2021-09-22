import path from 'path';
import { registerFields, Table } from '@nocobase/database';
import * as fields from './fields';
import * as usersActions from './actions/users';
import * as middlewares from './middlewares';
import { PluginOptions } from '@nocobase/server';

export default {
  name: 'users',
  async load() {
    const database = this.app.db;
    const resourcer = this.app.resourcer;

    registerFields(fields);

    this.app.on('db.init', async () => {
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

    resourcer.use(middlewares.parseToken({}));
  },
} as PluginOptions;
