/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
import type { Application } from '@nocobase/client-v2';
import NotificationManager, { type RegisterChannelOptions } from './notification-manager';

const NAMESPACE = 'notification-manager';

export class PluginNotificationManagerClientV2 extends Plugin<Record<string, never>, Application> {
  private manager!: NotificationManager;

  get channelTypes() {
    return this.manager.channelTypes;
  }

  registerChannelType(options: RegisterChannelOptions) {
    this.manager.registerChannelType(options);
  }

  async beforeLoad() {
    this.manager = new NotificationManager();
  }

  async load() {
    this.pluginSettingsManager.addMenuItem({
      key: NAMESPACE,
      title: this.t('Notification manager'),
      icon: 'NotificationOutlined',
      aclSnippet: 'pm.notification',
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: NAMESPACE,
      key: 'channels',
      title: this.t('Channels'),
      aclSnippet: 'pm.notification.channels',
      sort: 1,
      componentLoader: () => import('./pages/ChannelsPage'),
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: NAMESPACE,
      key: 'logs',
      title: this.t('Logs'),
      aclSnippet: 'pm.notification.logs',
      sort: 3,
      componentLoader: () => import('./pages/LogsPage'),
    });
  }
}

export default PluginNotificationManagerClientV2;
