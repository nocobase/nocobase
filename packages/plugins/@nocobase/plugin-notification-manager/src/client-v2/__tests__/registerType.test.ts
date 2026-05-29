/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import NotificationManager from '../notification-manager';

describe('registerType (v2)', () => {
  let manager: NotificationManager;
  beforeEach(() => {
    manager = new NotificationManager();
  });

  it('should register a new type with loader-based components', () => {
    const ChannelConfigFormLoader = () => Promise.resolve({ default: () => null });
    const MessageConfigFormLoader = () => Promise.resolve({ default: () => null });
    const newChannelType = {
      type: 'newType',
      title: 'New Type',
      components: {
        ChannelConfigFormLoader,
        MessageConfigFormLoader,
      },
    };

    manager.registerChannelType(newChannelType);
    expect(manager.channelTypes.get('newType')).toEqual(newChannelType);
  });
});
