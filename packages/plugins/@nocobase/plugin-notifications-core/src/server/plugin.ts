/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { Registry } from '@nocobase/utils';
import type { NotificationServer } from './types';

interface NotificatonType {
  title: string;
  server: NotificationServer;
}

class NotificationManager {
  protected notificationTypes = new Registry<NotificatonType>();
  registerTypes(type: string, config: NotificatonType) {
    this.notificationTypes.register(type, config);
  }
}

export class PluginNotificationServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {
    this.app.resourceManager.registerActionHandler('messages:trigger', (ctx, next) => {
      console.log(ctx);
      next();
    });
  }

  async load() {}

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginNotificationServer;
