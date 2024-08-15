/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import NotificationsServerPlugin, { SendFnType, NotificationServerBase } from '@nocobase/plugin-notification-manager';
import { channelType } from '../constant';
import { MailServer } from './mail-server';

export class PluginNotificationsMailServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    const notificationServer = this.pm.get(NotificationsServerPlugin) as NotificationsServerPlugin;
    notificationServer.notificationManager.registerTypes(channelType, {
      Server: MailServer,
    });
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginNotificationsMailServer;
