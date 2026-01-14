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
import { tval } from '@nocobase/utils/client';
import { NAMESPACE } from '../locale';
import { ContentConfigForm } from './components/ContentConfigForm';
import { MessageConfigForm } from './components/MessageConfigForm';
import { MessageManagerProvider } from './MessageManagerProvider';
import { setAPIClient } from './utils';

export class PluginNotificationInAppClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    setAPIClient(this.app.apiClient);
    this.app.use(MessageManagerProvider);
    const notification = this.pm.get(NotificationManager);
    notification.registerChannelType({
      title: tval('In-app message', { ns: NAMESPACE }),
      type: 'in-app-message',
      components: {
        ChannelConfigForm: () => null,
        MessageConfigForm,
        ContentConfigForm,
      },
      meta: {
        editable: true,
        creatable: true,
        deletable: true,
      },
    });
    const mobilePlugin = this.pm.get('mobile') as any;
    if (mobilePlugin?.mobileRouter) {
      Promise.all([
        import('./components/mobile/messageSchemaInitializerItem'),
        import('./components/mobile/ChannelPage'),
        import('./components/mobile/MessagePage'),
        import('./components/mobile/MobileTabBarMessageItem'),
      ])
        .then(
          ([
            { messageSchemaInitializerItem },
            { MobileChannelPage },
            { MobileMessagePage },
            { MobileTabBarMessageItem },
          ]) => {
            this.app.schemaInitializerManager.addItem(
              'mobile:tab-bar',
              'notification-in-app-message',
              messageSchemaInitializerItem,
            );
            this.app.addComponents({ MobileTabBarMessageItem });
            mobilePlugin.mobileRouter.add('mobile.page.in-app-message', {
              path: '/page/in-app-message',
            });
            mobilePlugin.mobileRouter.add('mobile.page.in-app-message.channels', {
              path: '/page/in-app-message',
              Component: MobileChannelPage,
            });
            mobilePlugin.mobileRouter.add('mobile.page.in-app-message.messages', {
              path: '/page/in-app-message/messages',
              Component: MobileMessagePage,
            });
          },
        )
        .catch((err) => {
          console.error('Failed to load mobile components for in-app message notification:', err);
        });
    }
  }
}

export default PluginNotificationInAppClient;
