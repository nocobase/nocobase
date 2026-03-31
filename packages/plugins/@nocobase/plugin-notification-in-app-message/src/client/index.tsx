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
import MobileManager from '@nocobase/plugin-mobile/client';
import { tval } from '@nocobase/utils/client';
import { MessageConfigForm } from './components/MessageConfigForm';
import { ContentConfigForm } from './components/ContentConfigForm';
import { NAMESPACE } from '../locale';
import { setAPIClient } from './utils';
import { messageSchemaInitializerItem } from './components/mobile/messageSchemaInitializerItem';
import { MobileChannelPage } from './components/mobile/ChannelPage';
import { MobileMessagePage } from './components/mobile/MessagePage';
import { MobileTabBarMessageItem } from './components/mobile/MobileTabBarMessageItem';
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
    const mobileManager = this.pm.get(MobileManager);
    this.app.schemaInitializerManager.addItem(
      'mobile:tab-bar',
      'notification-in-app-message',
      messageSchemaInitializerItem,
    );
    this.app.addComponents({ MobileTabBarMessageItem: MobileTabBarMessageItem });
    if (mobileManager.mobileRouter) {
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
