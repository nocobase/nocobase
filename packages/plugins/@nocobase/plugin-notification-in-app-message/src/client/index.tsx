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
    const mobileManager = this.pm.get('mobile') as any;
    if (mobileManager?.mobileRouter) {
      // 动态导入移动端组件，只有在移动端插件启用时才加载
      const { MobileChannelPage } = await import('./components/mobile/ChannelPage');
      const { MobileMessagePage } = await import('./components/mobile/MessagePage');
      const { messageSchemaInitializerItem } = await import('./components/mobile/messageSchemaInitializerItem');
      const { MobileTabBarMessageItem } = await import('./components/mobile/MobileTabBarMessageItem');

      this.app.schemaInitializerManager.addItem(
        'mobile:tab-bar',
        'notification-in-app-message',
        messageSchemaInitializerItem,
      );
      this.app.addComponents({ MobileTabBarMessageItem: MobileTabBarMessageItem });
      mobileManager.mobileRouter.add('mobile.page.in-app-message', {
        path: '/page/in-app-message',
      });
      mobileManager.mobileRouter.add('mobile.page.in-app-message.channels', {
        path: '/page/in-app-message',
        Component: MobileChannelPage,
      });
      mobileManager.mobileRouter.add('mobile.page.in-app-message.messages', {
        path: '/page/in-app-message/messages',
        Component: MobileMessagePage,
      });
    }
  }
}

export default PluginNotificationInAppClient;
