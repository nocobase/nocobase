/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { create, destroy } from './actions/api-keys';

export class PluginAPIKeysServer extends Plugin {
  resourceName = 'apiKeys';

  async generateAPIKey(values) {
    const { name, username, role: roleName, expiresIn } = values;
    const user = await this.db.getRepository('users').findOne({
      filter: {
        username,
      },
    });
    if (!user) {
      throw new Error('User not found');
    }
    const userId = user.id;
    const repository = this.db.getRepository('users.roles', userId);
    const role = await repository.findOne({
      filter: {
        name: roleName,
      },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    const token = this.app.authManager.jwt.sign({ userId, roleName }, { expiresIn });

    await this.db.getRepository(this.resourceName).create({
      values: {
        name,
        roleName,
        token,
        expiresIn,
      },
    });

    return token;
  }

  async beforeLoad() {
    this.app.resourcer.define({
      name: this.resourceName,
      actions: {
        create,
        destroy,
      },
      only: ['list', 'create', 'destroy'],
    });

    this.app.acl.registerSnippet({
      name: ['pm', this.name, 'configuration'].join('.'),
      actions: ['apiKeys:list', 'apiKeys:create', 'apiKeys:destroy'],
    });
  }

  async load() {
    this.app.resourcer.use(
      async (ctx, next) => {
        const { resourceName, actionName } = ctx.action;
        if (resourceName === this.resourceName && ['list', 'destroy'].includes(actionName)) {
          ctx.action.mergeParams({
            filter: {
              createdById: ctx.auth.user.id,
            },
          });
        }
        await next();
      },
      {
        group: 'apiKeys',
        before: 'acl',
        after: 'auth',
      },
    );
  }
}

export default PluginAPIKeysServer;
