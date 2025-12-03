/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';

export class PluginAclAllowServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    // Visit http://localhost:13000/api/users:action1
    this.app.resourceManager.registerActionHandler('users:action1', async (ctx, next) => {
      ctx.body = {
        message: 'You have permission to access this action.',
      };
      await next();
    });
    // Visit http://localhost:13000/api/users:action2?token=<your_login_token>
    this.app.resourceManager.registerActionHandler('users:action2', async (ctx, next) => {
      ctx.body = {
        message: 'You have permission to access this action.',
      };
      await next();
    });
    // Visit http://localhost:13000/api/users:action3?token=<your_login_token>
    this.app.resourceManager.registerActionHandler('users:action3', async (ctx, next) => {
      ctx.body = {
        message: 'You have permission to access this action.',
      };
      await next();
    });
    this.app.acl.allow('users', 'action1', 'public');
    this.app.acl.allow('users', 'action2', 'loggedIn');
    this.app.acl.allow('users', 'action3', (ctx) => {
      return ctx.auth.user?.id !== 2;
    });
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginAclAllowServer;
