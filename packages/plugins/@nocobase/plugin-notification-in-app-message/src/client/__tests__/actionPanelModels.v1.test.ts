/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { getApiClient } from '../../client-v2/apiClient';
import { inboxVisible } from '../observables';
import PluginNotificationInAppClient from '../index';

type RegisteredNotificationEntryAction = {
  prototype: {
    onClick: (event?: unknown) => Promise<void>;
  };
};

type NotificationEntryActionInstance = {
  context: { isMobileLayout: boolean };
  dispatchEvent: ReturnType<typeof vi.fn>;
  onClick: (event?: unknown) => Promise<void>;
};

describe('PluginNotificationInAppClient action panel models', () => {
  it('registers and initializes the notification entry models in the v1 runtime', async () => {
    const apiClient = { request: vi.fn() };
    const registerModels = vi.fn();
    const notificationManager = { registerChannelType: vi.fn() };
    const mobileManager = { mobileRouter: { add: vi.fn() } };
    const pm = {
      get: vi.fn().mockReturnValueOnce(notificationManager).mockReturnValueOnce(mobileManager),
    };
    const app = {
      addComponents: vi.fn(),
      apiClient,
      schemaInitializerManager: { addItem: vi.fn() },
      use: vi.fn(),
    };
    const plugin = {
      app,
      flowEngine: { registerModels },
      pm,
    };

    await PluginNotificationInAppClient.prototype.load.call(plugin as unknown as PluginNotificationInAppClient);

    expect(getApiClient()).toBe(apiClient);
    expect(registerModels).toHaveBeenCalledWith(
      expect.objectContaining({
        NotificationEmbeddedPageModel: expect.any(Function),
        NotificationEntryActionModel: expect.any(Function),
        NotificationPageMenuModel: expect.any(Function),
      }),
    );

    const registeredModels = registerModels.mock.calls[0][0] as Record<string, RegisteredNotificationEntryAction>;
    const EntryActionModel = registeredModels.NotificationEntryActionModel;
    const model = Object.create(EntryActionModel.prototype) as NotificationEntryActionInstance;
    Object.defineProperty(model, 'context', {
      configurable: true,
      value: { isMobileLayout: false },
    });
    model.dispatchEvent = vi.fn();
    inboxVisible.value = false;

    await model.onClick({ type: 'click' });

    expect(inboxVisible.value).toBe(true);
    expect(model.dispatchEvent).not.toHaveBeenCalled();

    const mobileModel = Object.create(EntryActionModel.prototype) as NotificationEntryActionInstance;
    Object.defineProperty(mobileModel, 'context', {
      configurable: true,
      value: { isMobileLayout: true },
    });
    mobileModel.dispatchEvent = vi.fn().mockResolvedValue(undefined);

    await mobileModel.onClick({ type: 'click' });

    expect(mobileModel.dispatchEvent).toHaveBeenCalledWith(
      'click',
      expect.objectContaining({
        isMobileLayout: true,
        pageModelClass: 'NotificationEmbeddedPageModel',
      }),
      expect.objectContaining({ debounce: true }),
    );
  });
});
