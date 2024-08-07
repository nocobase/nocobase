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
import { MessageManager } from './manager/message/components/Manager';
import { LogManager } from './manager/log/components/Manager';
import { ComponentType } from 'react';
import { ChannelType } from './manager/channel/types';

export class PluginNotificationCoreClient extends Plugin {
  channelTypes = new Registry<ChannelType>();
  registerChannelType(channelTypeName: string, options: ChannelType) {
    this.channelTypes.register(channelTypeName, options);
  }
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    console.log(this.app);
    this.app.pluginSettingsManager.add(NAMESPACE, {
      title: this.t('Notification'),
      icon: 'NotificationOutlined',
    });
    this.app.pluginSettingsManager.add(`${NAMESPACE}.channels`, {
      title: 'Channels',
      Component: ChannelManager,
      icon: 'SendOutlined',
      aclSnippet: 'pm.notification.core',
      sort: 1,
    });
    this.app.pluginSettingsManager.add(`${NAMESPACE}.templates`, {
      title: 'Templates',
      Component: ManagementList,
      icon: 'SnippetsOutlined',
      aclSnippet: 'pm.notification.core',
      sort: 2,
    });

    // this.app.pluginSettingsManager.add(`${NAMESPACE}.messages`, {
    //   title: 'Messages',
    //   Component: MessageManager,
    //   icon: 'MessageOutlined',
    //   aclSnippet: 'pm.notification.core',
    //   sort: 3,
    // });
    this.app.pluginSettingsManager.add(`${NAMESPACE}.logs`, {
      title: 'Logs',
      Component: LogManager,
      icon: 'MessageOutlined',
      aclSnippet: 'pm.notification.core',
      sort: 4,
    });
    // this.app.addComponents({})
    // this.app.addScopes({})
    // this.app.addProvider()
    // this.app.addProviders()
    // this.app.router.add()
  }
}

export default PluginNotificationCoreClient;
export { MessageConfigForm } from './manager/message/components/MessageConfigForm';
export { NotificationVariableContext, useNotificationVariableOptions, NotificationVariableProvider } from './hooks';
