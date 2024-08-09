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
import { lang as t } from './locale';
import { ChannelType } from './manager/channel/types';

export class PluginNotificationManagerClient extends Plugin {
  channelTypes = new Registry<ChannelType>();
  registerChannelType(channelTypeName: string, options: ChannelType) {
    this.channelTypes.register(channelTypeName, options);
  }
  async afterAdd() {}

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    this.app.pluginSettingsManager.add(NAMESPACE, {
      title: t('Notification'),
      icon: 'NotificationOutlined',
    });
    this.app.pluginSettingsManager.add(`${NAMESPACE}.channels`, {
      title: t('Channels'),
      Component: ChannelManager,
      icon: 'SendOutlined',
      aclSnippet: 'pm.notification.core',
      sort: 1,
    });
    // this.app.pluginSettingsManager.add(`${NAMESPACE}.templates`, {
    //   title: t('Templates'),
    //   Component: ManagementList,
    //   icon: 'SnippetsOutlined',
    //   aclSnippet: 'pm.notification.core',
    //   sort: 2,
    // });
    this.app.pluginSettingsManager.add(`${NAMESPACE}.logs`, {
      title: t('Logs'),
      Component: LogManager,
      icon: 'MessageOutlined',
      aclSnippet: 'pm.notification.core',
      sort: 3,
    });
  }
}

export default PluginNotificationManagerClient;
export { MessageConfigForm } from './manager/message/components/MessageConfigForm';
export { NotificationVariableContext, useNotificationVariableOptions, NotificationVariableProvider } from './hooks';
