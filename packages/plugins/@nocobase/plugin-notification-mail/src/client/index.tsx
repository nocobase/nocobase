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
import { ChannelConfigForm } from './ConfigForm';
import { ContentConfigForm } from './MessageConfigForm';
export class PluginNotificationsMailClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}
  async load() {
    const notification = this.pm.get(NotificationManager);
    notification.registerChannelType(channelType, {
      title: tval('Mail', { ns: NAMESPACE }),
      name: channelType,
      components: {
        ChannelConfigForm: ChannelConfigForm,
        ContentConfigForm: ContentConfigForm,
      },
    });
  }
}

export default PluginNotificationsMailClient;
