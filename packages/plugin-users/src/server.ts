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
        nickname: 'Super Admin',
        email: process.env.ADMIN_EMAIL || 'admin@nocobase.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
      });
    });

    database.on('afterTableInit', (table: Table) => {
      let { createdBy, updatedBy } = table.getOptions();
      if (createdBy !== false) {
        table.addField({
          type: 'createdBy',
          name: typeof createdBy === 'string' ? createdBy : 'createdBy',
          target: 'users',
          state: 0,
        });
      }
      if (updatedBy !== false) {
        table.addField({
          type: 'updatedBy',
          name: typeof updatedBy === 'string' ? updatedBy : 'updatedBy',
          target: 'users',
          state: 0,
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
