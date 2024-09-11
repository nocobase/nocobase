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
import { PassThrough } from 'stream';
import NotificationsServerPlugin, { SendFnType, NotificationServerBase } from '@nocobase/plugin-notification-manager';
import NotificationInSiteServer from './NotificationServer';
export class PluginNotificationInAppServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    const inSiteServer = new NotificationInSiteServer({ plugin: this });
    inSiteServer.defineActions();

    const notificationServer = this.pm.get(NotificationsServerPlugin) as NotificationsServerPlugin;
    notificationServer.notificationManager.registerTypes(inAppTypeName, {
      server: inSiteServer,
    });
  }

  async install() {
    const channelsRepo = this.app.db.getRepository(COLLECTION_NAME.channels);
    const channel = await channelsRepo.findOne({ filter: { notificationType: inAppTypeName } });
    if (!channel) {
      await channelsRepo.create({
        values: { name: inAppTypeName, title: '站内信', notificationType: inAppTypeName, description: '站内信' },
      });
    }
  }

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginNotificationInAppServer;
