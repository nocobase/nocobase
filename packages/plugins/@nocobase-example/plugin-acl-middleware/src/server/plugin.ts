/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';

export class PluginAclMiddlewareServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    // Visit http://localhost:13000/api/users:action1?token=<your_login_token>
    this.app.resourceManager.registerActionHandler('users:action1', async (ctx, next) => {
      ctx.body = {
        message: 'You have permission to access this action.',
      };
      await next();
    });
    this.app.acl.use(async (ctx, next) => {
      const { resourceName, actionName } = ctx.action;
      if (resourceName === 'users' && actionName === 'action1') {
        if (ctx.auth.user?.id === 2) {
          ctx.permission.skip = true;
        }
      }
      await next();
    });
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginAclMiddlewareServer;
