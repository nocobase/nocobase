/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { COLLECTION_NAME } from '@nocobase/plugin-notification-manager/src/constant';
import { inAppTypeName } from '../types';

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

  async load() {
    const channelsRepo = this.app.db.getRepository(COLLECTION_NAME.channels);
    const channel = await channelsRepo.findOne({ filter: { notificationType: inAppTypeName } });
    if (!channel) {
      await channelsRepo.create({
        values: { name: inAppTypeName, title: '站内信', notificationType: inAppTypeName, description: '站内信' },
      });
    }
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginNotificationInAppServer;
