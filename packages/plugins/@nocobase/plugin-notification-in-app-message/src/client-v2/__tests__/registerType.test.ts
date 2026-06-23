/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import NotificationManager from '../../../../plugin-notification-manager/src/client-v2/notification-manager';

describe('plugin-notification-in-app-message v2', () => {
  it('registers an in-app-message channel type on the v2 manager', () => {
    const manager = new NotificationManager();
    const messageLoader = () => import('../components/MessageConfigForm');
    manager.registerChannelType({
      type: 'in-app-message',
      title: '{{t("In-app message")}}',
      components: {
        MessageConfigFormLoader: messageLoader,
      },
      meta: { creatable: true, editable: true, deletable: true },
    });
    const registered = manager.channelTypes.get('in-app-message');
    expect(registered).toBeDefined();
    expect(registered?.type).toBe('in-app-message');
    expect(registered?.meta?.creatable).toBe(true);
    expect(registered?.components?.MessageConfigFormLoader).toBe(messageLoader);
  });

  it('lazy-loads the MessageConfigForm module on demand', async () => {
    const mod = await import('../components/MessageConfigForm');
    expect(typeof mod.default).toBe('function');
    expect(mod.MessageConfigForm).toBe(mod.default);
  });
});
