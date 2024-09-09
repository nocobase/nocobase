/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { MessageManagerProvider } from './MessageManagerProvider';
import NotificationManager from '@nocobase/plugin-notification-manager/client';
import { tval } from '@nocobase/utils/client';
import { lang as t } from '../locale';
import { ContentConfigForm } from './components/MessageConfigForm';
import { MessageList } from './components/MessageList/index';
export const NAMESPACE = 'inbox';
export class PluginNotificationInAppClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    this.app.use(MessageManagerProvider);
    this.app.pluginSettingsManager.add(NAMESPACE, {
      title: t('Inbox'),
      icon: 'MailOutlined',
      aclSnippet: 'pm.inbox',
      Component: MessageList,
    });
    const notification = this.pm.get(NotificationManager);
    notification.manager.registerChannelType({
      title: tval('In-site message', { ns: NAMESPACE }),
      name: 'in-site-message',
      components: {
        ChannelConfigForm: null,
        ContentConfigForm: ContentConfigForm,
      },
    });
  }
}

export default PluginNotificationInAppClient;
