/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { lang as t } from './locale';
import { ChannelManager } from './manager/channel/components';
import { RegisterChannelOptions } from './manager/channel/types';
import { LogManager } from './manager/log/components/Manager';
import NotificationManager from './notification-manager';

const NAMESPACE = 'notification-manager';
export class PluginNotificationManagerClient extends Plugin {
  private manager: NotificationManager;

  get channelTypes() {
    return this.manager.channelTypes;
  }

  registerChannelType(options: RegisterChannelOptions) {
    this.manager.registerChannelType(options);
  }

  async afterAdd() {}

  async beforeLoad() {
    this.manager = new NotificationManager();
  }

  // You can get and modify the app instance here
  async load() {
    this.app.pluginSettingsManager.add(NAMESPACE, {
      title: t('Notification manager'),
      icon: 'NotificationOutlined',
      aclSnippet: 'pm.notification',
    });
    this.app.pluginSettingsManager.add(`${NAMESPACE}.channels`, {
      title: t('Channels'),
      Component: ChannelManager,
      aclSnippet: 'pm.notification.channels',
      sort: 1,
    });
    this.app.pluginSettingsManager.add(`${NAMESPACE}.logs`, {
      title: t('Logs'),
      Component: LogManager,
      aclSnippet: 'pm.notification.logs',
      sort: 3,
    });
  }
}

export { NotificationVariableContext, NotificationVariableProvider, useNotificationVariableOptions } from './hooks';
export { MessageConfigForm } from './manager/message/components/MessageConfigForm';
export default PluginNotificationManagerClient;
