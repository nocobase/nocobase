import { Collection } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import { resolve } from 'path';
import * as actions from './actions/users';
import * as middlewares from './middlewares';

export default class UsersPlugin extends Plugin {

  async beforeLoad() {
    this.db.on('users.afterCreateWithAssociations', async (model, options) => {
      const { transaction } = options;

      if (this.app.db.getCollection('roles')) {
        const defaultRole = await this.app.db.getRepository('roles').findOne({
          filter: {
            default: true,
          },
          transaction,
        });

        if (defaultRole && (await model.countRoles({ transaction })) == 0) {
          await model.addRoles(defaultRole, { transaction });
        }
      }
    });

    this.db.on('afterDefineCollection', (collection: Collection) => {
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

    for (const [key, action] of Object.entries(actions)) {
      this.app.resourcer.registerActionHandler(`users:${key}`, action);
    }

    this.app.resourcer.use(middlewares.parseToken());
  }

  async load() {
    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });
  }

  async install() {
    const {
      adminNickname = 'Super Admin',
      adminEmail = 'admin@nocobase.com',
      adminPassword = 'admin123',
    } = this.options;

    const User = this.db.getCollection('users');
    await User.repository.create({
      values: {
        nickname: adminNickname,
        email: adminEmail,
        password: adminPassword,
        roles: ['admin'],
      },
    });
  }

}
