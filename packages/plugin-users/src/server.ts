import path from 'path';
import * as actions from './actions/users';
import * as middlewares from './middlewares';
import { Collection } from '@nocobase/database';
import { PluginOptions } from '@nocobase/server';

export default {
  name: 'users',
  async load() {
    const database = this.app.db;
    const resourcer = this.app.resourcer;

    this.app.on('db.init', async () => {
      const User = database.getCollection('users');
      await User.model.create({
        nickname: 'Super Admin',
        email: process.env.ADMIN_EMAIL || 'admin@nocobase.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
      });
    });

    database.on('users.afterCreate', async (model, options) => {
      const { transaction } = options;
      const defaultRole = await this.app.db.getRepository('roles').findOne({
        filter: {
          default: true,
        },
        transaction,
      });

      if (defaultRole) {
        await model.addRoles(defaultRole, { transaction });
      }
    });

    database.on('afterDefineCollection', (collection: Collection) => {
      let { createdBy, updatedBy } = collection.options;
      if (createdBy === true) {
        collection.setField('createdById', {
          type: 'context',
          dataType: 'integer',
          dataIndex: 'state.currentUser.id',
          createOnly: true,
        });
        collection.setField('createdBy', {
          type: 'belongsTo',
          target: 'users',
          foreignKey: 'createdById',
          targetKey: 'id',
        });
      }
      if (updatedBy === true) {
        collection.setField('updatedById', {
          type: 'context',
          dataType: 'integer',
          dataIndex: 'state.currentUser.id',
        });
        collection.setField('updatedBy', {
          type: 'belongsTo',
          target: 'users',
          foreignKey: 'updatedById',
          targetKey: 'id',
        });
      }
    });

    await database.import({
      directory: path.resolve(__dirname, 'collections'),
    });

    for (const [key, action] of Object.entries(actions)) {
      resourcer.registerActionHandler(`users:${key}`, action);
    }

    resourcer.use(middlewares.parseToken({}));
  },
} as PluginOptions;
