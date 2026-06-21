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
    this.app.resourceManager.define({
      name: 'testAclMiddleware',
      actions: {
        // Visit http://localhost:13000/api/testAclMiddleware:action1?token=<your_login_token>
        action1: async (ctx, next) => {
          ctx.body = {
            message: 'You have permission to access this action.',
          };
          await next();
        },
      },
    });
    this.app.acl.use(
      async (ctx, next) => {
        const { resourceName, actionName } = ctx.action;
        if (resourceName === 'testAclMiddleware' && actionName === 'action1') {
          // ID 为 2 的用户跳过 testAclMiddleware:action1 权限校验（可以访问）
          if (ctx.state.currentRoles?.includes('member')) {
            ctx.permission.skip = true;
          }
        }
        await next();
      },
      {
        before: 'core',
      },
    );
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginAclMiddlewareServer;
