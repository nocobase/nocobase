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
