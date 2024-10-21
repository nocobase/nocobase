/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import NotificationManager from '../notification-manager';

describe('registerType', () => {
  let plugin: NotificationManager;
  beforeEach(() => {
    plugin = new NotificationManager();
  });

  it('should register a new type', () => {
    const ChannelConfigForm = () => null;
    const MessageConfigForm = () => null;
    const newChannelType = {
      type: 'newType',
      title: 'New Type',
      components: {
        ChannelConfigForm,
        MessageConfigForm,
      },
    };

    plugin.registerChannelType(newChannelType);
    expect(plugin.channelTypes.get('newType')).toEqual(newChannelType);
  });
});
