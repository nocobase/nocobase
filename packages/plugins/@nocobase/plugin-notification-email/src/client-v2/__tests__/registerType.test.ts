/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import NotificationManager from '../../../../plugin-notification-manager/src/client-v2/notification-manager';

describe('plugin-notification-email v2', () => {
  it('registers an email channel type with a ChannelConfigFormLoader on the v2 manager', () => {
    const manager = new NotificationManager();
    const loader = () => import('../forms/ChannelConfigForm');
    const messageLoader = () => import('../forms/MessageConfigForm');
    manager.registerChannelType({
      type: 'email',
      title: '{{t("Email")}}',
      components: {
        ChannelConfigFormLoader: loader,
        MessageConfigFormLoader: messageLoader,
      },
      meta: { creatable: true, editable: true, deletable: true },
    });
    const registered = manager.channelTypes.get('email');
    expect(registered).toBeDefined();
    expect(registered?.type).toBe('email');
    expect(registered?.meta?.creatable).toBe(true);
    expect(registered?.components?.ChannelConfigFormLoader).toBe(loader);
    expect(registered?.components?.MessageConfigFormLoader).toBe(messageLoader);
  });

  it('lazy-loads the ChannelConfigForm module on demand', async () => {
    const mod = await import('../forms/ChannelConfigForm');
    expect(typeof mod.default).toBe('function');
    expect(mod.ChannelConfigForm).toBe(mod.default);
  });

  it('lazy-loads the MessageConfigForm module on demand', async () => {
    const mod = await import('../forms/MessageConfigForm');
    expect(typeof mod.default).toBe('function');
    expect(mod.MessageConfigForm).toBe(mod.default);
  });
});
