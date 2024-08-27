/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';

export class PluginNotificationInAppServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {
    // this.app.resourceManager.registerActionHandler('inAppMessages:sse', async (ctx, next) => {
    //   console.log(ctx.action);
    //   next();
    // });
    this.app.resourceManager.define({
      name: 'inAppMessages',
      actions: {
        sse: {
          async handler(ctx, next) {
            const userId = ctx.state.user.id;
            next();
          },
        },
      },
    });
  }

  async load() {}

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginNotificationInAppServer;
