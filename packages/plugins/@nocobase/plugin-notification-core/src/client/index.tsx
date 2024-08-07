/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { Registry } from '@nocobase/utils/client';
import { NAMESPACE } from './locale';
import { ManagementList } from './Management';
import { ChannelManager } from './manager/channel/components';
import { ComponentType } from 'react';
export type ChannelOptions = {
  components: {
    configForm: ComponentType;
  };
};
export class PluginNotificationCoreClient extends Plugin {
  channelTypes = new Registry<ChannelOptions>();
  registerChannelType(channelType: string, options: ChannelOptions) {
    this.channelTypes.register(channelType, options);
  }
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    console.log(this.app);
    this.app.pluginSettingsManager.add(NAMESPACE, {
      title: this.t('Notification Management'),
      icon: 'NotificationOutlined',
    });
    this.app.pluginSettingsManager.add(`${NAMESPACE}.notifications`, {
      title: 'Channels',
      Component: ChannelManager,
      icon: 'NotificationOutlined',
      aclSnippet: 'pm.notification.core',
      sort: 1,
    });
    this.app.pluginSettingsManager.add(`${NAMESPACE}.notifrecords`, {
      title: 'Templates',
      Component: ManagementList,
      icon: 'NotificationOutlined',
      aclSnippet: 'pm.notification.core',
      sort: 2,
    });

    this.app.pluginSettingsManager.add(`${NAMESPACE}.channels`, {
      title: 'Messages',
      Component: ChannelManager,
      icon: 'NotificationOutlined',
      aclSnippet: 'pm.notification.core',
      sort: 3,
    });
    // this.app.addComponents({})
    // this.app.addScopes({})
    // this.app.addProvider()
    // this.app.addProviders()
    // this.app.router.add()
  }
}

export default PluginNotificationCoreClient;
