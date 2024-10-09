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
import { MessageConfigForm } from './components/MessageConfigForm';
import { NAMESPACE } from '../locale';
import { setAPIClient } from './utils';
export class PluginNotificationInAppClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    setAPIClient(this.app.apiClient);
    this.app.use(MessageManagerProvider);
    const notification = this.pm.get(NotificationManager);
    notification.registerChannelType({
      title: tval('In-site message', { ns: NAMESPACE }),
      key: 'in-site-message',
      components: {
        MessageConfigForm: MessageConfigForm,
      },
      meta: {
        editable: false,
        createable: false,
        deletable: false,
      },
    });
  }
}

export default PluginNotificationInAppClient;
