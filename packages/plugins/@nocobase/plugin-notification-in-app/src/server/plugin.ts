/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { COLLECTION_NAME } from '@nocobase/plugin-notification-manager';
import { inAppTypeName } from '../types';
import NotificationsServerPlugin from '@nocobase/plugin-notification-manager';
import InAppNotificationChannel from './InAppNotificationChannel';

const NAMESPACE = 'notification-in-app';
export class PluginNotificationInAppServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    const notificationServer = this.pm.get(NotificationsServerPlugin) as NotificationsServerPlugin;
    const instance = new InAppNotificationChannel(this.app);
    instance.load();
    notificationServer.registerChannelType({ type: inAppTypeName, Channel: InAppNotificationChannel });
  }

  async install() {
    const channelsRepo = this.app.db.getRepository(COLLECTION_NAME.channels);
    const channel = await channelsRepo.findOne({ filter: { notificationType: inAppTypeName } });
    if (!channel) {
      await channelsRepo.create({
        values: {
          name: inAppTypeName,
          title: `{{t("In-app message", { ns: "${NAMESPACE}" })}}`,
          notificationType: inAppTypeName,
          description: `{{t("In-app message", { ns: "${NAMESPACE}" })}}`,
        },
      });
    }
  }

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginNotificationInAppServer;
