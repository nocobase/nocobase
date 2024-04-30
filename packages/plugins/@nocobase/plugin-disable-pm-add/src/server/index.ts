/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { InstallOptions, Plugin } from '@nocobase/server';

export class PluginDisablePmAddServer extends Plugin {
  beforeLoad() {
    // TODO
  }

  async load() {
    this.app.resourcer.use(async (ctx, next) => {
      const { resourceName, actionName } = ctx.action;
      if (resourceName === 'pm' && actionName === 'add') {
        ctx.throw(403, 'The current environment does not allow adding plugins online');
      }
      await next();
    });
  }

  async disable() {
    // this.app.resourcer.removeResource('testHello');
  }

  async install(options: InstallOptions) {
    // TODO
  }
}

export default PluginDisablePmAddServer;
