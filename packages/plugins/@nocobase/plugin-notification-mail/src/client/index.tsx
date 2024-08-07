/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import NotificationManager from '@nocobase/plugin-notification-manager/client';
import { channelType, NAMESPACE } from '../constant';
import { tval } from '@nocobase/utils/client';
import { ConfigForm } from './ConfigForm';
export class PluginNotificationsMailClient extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    const notification = this.pm.get(NotificationManager);
    notification.registerChannelType(channelType, {
      title: tval(channelType, { ns: NAMESPACE }),
      name: channelType,
      components: {
        ConfigForm: ConfigForm,
      },
    });
    // this.app.addComponents({})
    // this.app.addScopes({})
    // this.app.addProvider()
    // this.app.addProviders()
    // this.app.router.add()
  }
}

export default PluginNotificationsMailClient;
