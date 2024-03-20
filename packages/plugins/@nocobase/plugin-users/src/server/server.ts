import { Collection, Op } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import { parse } from '@nocobase/utils';
import { resolve } from 'path';

import * as actions from './actions/users';
import { Cache } from '@nocobase/cache';
import { UserModel } from './models/UserModel';

export default class PluginUsersServer extends Plugin {
  async beforeLoad() {
    this.db.registerModels({
      UserModel,
    });
    this.db.registerOperators({
      $isCurrentUser(_, ctx) {
        return {
          [Op.eq]: ctx?.app?.ctx?.state?.currentUser?.id || -1,
        };
      },
      $isNotCurrentUser(_, ctx) {
        return {
          [Op.ne]: ctx?.app?.ctx?.state?.currentUser?.id || -1,
        };
      },
      $isVar(val, ctx) {
        const obj = parse({ val: `{{${val}}}` })(JSON.parse(JSON.stringify(ctx?.app?.ctx?.state)));
        return {
          [Op.eq]: obj.val,
        };
      },
    });

    this.db.on('field.afterAdd', ({ collection, field }) => {
      if (field.options.interface === 'createdBy') {
        collection.setField('createdById', {
          type: 'context',
          dataType: 'bigInt',
          dataIndex: 'state.currentUser.id',
          createOnly: true,
          visible: true,
          index: true,
        });
      }

      if (field.options.interface === 'updatedBy') {
        collection.setField('updatedById', {
          type: 'context',
          dataType: 'bigInt',
          dataIndex: 'state.currentUser.id',
          visible: true,
          index: true,
        });
      }
    });

    this.db.on('afterDefineCollection', (collection: Collection) => {
      const { createdBy, updatedBy } = collection.options;
      if (createdBy === true) {
        collection.setField('createdById', {
          type: 'context',
          dataType: 'bigInt',
          dataIndex: 'state.currentUser.id',
          createOnly: true,
          visible: true,
          index: true,
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
          dataType: 'bigInt',
          dataIndex: 'state.currentUser.id',
          visible: true,
          index: true,
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

    this.app.acl.addFixedParams('users', 'destroy', () => {
      return {
        filter: {
          'id.$ne': 1,
        },
      };
    });

    this.app.acl.addFixedParams('collections', 'destroy', () => {
      return {
        filter: {
          'name.$ne': 'users',
        },
      };
    });

    const loggedInActions = ['updateProfile'];
    loggedInActions.forEach((action) => this.app.acl.allow('users', action, 'loggedIn'));

    this.app.acl.registerSnippet({
      name: `pm.${this.name}.*`,
      actions: ['users:listExcludeRole', 'users:list'],
    });
  }

  async load() {
    await this.importCollections(resolve(__dirname, 'collections'));
    this.db.addMigrations({
      namespace: 'users',
      directory: resolve(__dirname, 'migrations'),
      context: {
        plugin: this,
      },
    });

    this.app.resourcer.use(async (ctx, next) => {
      await next();
      const { associatedName, resourceName, actionName, values } = ctx.action.params;
      const cache = ctx.app.cache as Cache;
      if (
        associatedName === 'roles' &&
        resourceName === 'users' &&
        ['add', 'remove', 'set'].includes(actionName) &&
        values?.length
      ) {
        // Delete cache when the members of a department changed
        for (const userId of values) {
          await cache.del(`roles:${userId}`);
        }
      }
    });
  }

  getInstallingData(options: any = {}) {
    const { INIT_ROOT_NICKNAME, INIT_ROOT_PASSWORD, INIT_ROOT_EMAIL, INIT_ROOT_USERNAME } = process.env;
    const {
      rootEmail = INIT_ROOT_EMAIL || 'admin@nocobase.com',
      rootPassword = INIT_ROOT_PASSWORD || 'admin123',
      rootNickname = INIT_ROOT_NICKNAME || 'Super Admin',
      rootUsername = INIT_ROOT_USERNAME || 'nocobase',
    } = options.users || options?.cliArgs?.[0] || {};
    return {
      rootEmail,
      rootPassword,
      rootNickname,
      rootUsername,
    };
  }

  async install(options) {
    const { rootNickname, rootPassword, rootEmail, rootUsername } = this.getInstallingData(options);
    const User = this.db.getCollection('users');
    if (await User.repository.findOne({ filter: { email: rootEmail } })) {
      return;
    }

    await User.repository.create({
      values: {
        email: rootEmail,
        password: rootPassword,
        nickname: rootNickname,
        username: rootUsername,
      },
    });

    const repo = this.db.getRepository<any>('collections');
    if (repo) {
      await repo.db2cm('users');
    }
  }
}
