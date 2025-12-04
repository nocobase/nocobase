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
    this.app.resourceManager.define({
      name: 'testAclAllow',
      actions: {
        // Visit http://localhost:13000/api/testAclAllow:action1
        action1: async (ctx, next) => {
          ctx.body = {
            message: 'You have permission to access this action.',
          };
          await next();
        },
        // Visit http://localhost:13000/api/testAclAllow:action2?token=<your_login_token>
        action2: async (ctx, next) => {
          ctx.body = {
            message: 'You have permission to access this action.',
          };
          await next();
        },
        // Visit http://localhost:13000/api/testAclAllow:action3?token=<your_login_token>
        action3: async (ctx, next) => {
          ctx.body = {
            message: 'You have permission to access this action.',
          };
          await next();
        },
      },
    });
    this.app.acl.allow('testAclAllow', 'action1', 'public');
    this.app.acl.allow('testAclAllow', 'action2', 'loggedIn');
    this.app.acl.allow('testAclAllow', 'action3', (ctx) => {
      return ctx.auth.user?.id === 2;
    });
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginAclAllowServer;
