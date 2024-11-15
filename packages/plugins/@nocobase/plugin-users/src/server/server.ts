/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, Model, Op } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import { parse } from '@nocobase/utils';
import * as actions from './actions/users';
import { UserModel } from './models/UserModel';
import PluginUserDataSyncServer from '@nocobase/plugin-user-data-sync';
import { UserDataSyncResource } from './user-data-sync-resource';

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
          uiSchema: {
            type: 'object',
            title: '{{t("Created by")}}',
            'x-component': 'AssociationField',
            'x-component-props': {
              fieldNames: {
                value: 'id',
                label: 'nickname',
              },
            },
            'x-read-pretty': true,
          },
          interface: 'createdBy',
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
          uiSchema: {
            type: 'object',
            title: '{{t("Last updated by")}}',
            'x-component': 'AssociationField',
            'x-component-props': {
              fieldNames: {
                value: 'id',
                label: 'nickname',
              },
            },
            'x-read-pretty': true,
          },
          interface: 'updatedBy',
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
      name: `pm.${this.name}`,
      actions: ['users:*'],
    });
  }

  async load() {
    this.app.resourceManager.use(async function deleteRolesCache(ctx, next) {
      await next();
      const { associatedName, resourceName, actionName, values } = ctx.action.params;
      if (
        associatedName === 'roles' &&
        resourceName === 'users' &&
        ['add', 'remove', 'set'].includes(actionName) &&
        values?.length
      ) {
        // Delete cache when the members of a role changed
        await Promise.all(values.map((userId: number) => ctx.app.emitAsync('cache:del:roles', { userId })));
      }
    });

    const userDataSyncPlugin = this.app.pm.get('user-data-sync') as PluginUserDataSyncServer;
    if (userDataSyncPlugin && userDataSyncPlugin.enabled) {
      userDataSyncPlugin.resourceManager.registerResource(new UserDataSyncResource(this.db, this.app.logger));
    }

    this.app.db.on('users.beforeUpdate', async (model: Model) => {
      if (!model._changed.has('password')) {
        return;
      }
      model.set('passwordChangeTz', Date.now());
      await this.app.emitAsync('cache:del:roles', { userId: model.get('id') });
      await this.app.emitAsync('cache:del:auth', { userId: model.get('id') });
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
