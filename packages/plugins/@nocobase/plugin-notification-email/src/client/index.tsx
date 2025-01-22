/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import PluginNotificationManagerClient from '@nocobase/plugin-notification-manager/client';
import { tval } from '@nocobase/utils/client';
import { channelType, NAMESPACE } from '../constant';
import { ChannelConfigForm } from './ConfigForm';
import { MessageConfigForm } from './MessageConfigForm';
import { ContentConfigForm } from './ContentConfigForm';
export class PluginNotificationMailClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}
  async load() {
    const notification = this.pm.get(PluginNotificationManagerClient);
    notification.registerChannelType({
      title: tval('Email', { ns: NAMESPACE }),
      type: channelType,
      components: {
        ChannelConfigForm: ChannelConfigForm,
        MessageConfigForm: MessageConfigForm,
        ContentConfigForm,
      },
    });
  }
}

export default PluginNotificationMailClient;
