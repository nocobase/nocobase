/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import PluginNotificationInAppMessageClientV2 from '../plugin';

function createPlugin() {
  const app = {
    apiClient: {},
    entryActionManager: { register: vi.fn() },
    flowEngine: { registerModelLoaders: vi.fn() },
    i18n: { t: (key: string) => key },
  };
  type PluginConstructorArgs = ConstructorParameters<typeof PluginNotificationInAppMessageClientV2>;
  return {
    app,
    plugin: new PluginNotificationInAppMessageClientV2(
      { packageName: 'notification-in-app-message' } as PluginConstructorArgs[0],
      app as PluginConstructorArgs[1],
    ),
  };
}

describe('PluginNotificationInAppMessageClientV2 action panel entry', () => {
  it('registers notification entry models and action-panel provider', async () => {
    const { app, plugin } = createPlugin();

    await plugin.load();

    expect(app.flowEngine.registerModelLoaders).toHaveBeenCalledWith(
      expect.objectContaining({
        InboxTopbarActionModel: expect.objectContaining({
          extends: 'TopbarActionModel',
          loader: expect.any(Function),
        }),
        NotificationEntryActionModel: expect.objectContaining({
          extends: 'ActionModel',
          loader: expect.any(Function),
        }),
        NotificationEmbeddedPageModel: expect.objectContaining({
          extends: 'ChildPageModel',
          loader: expect.any(Function),
        }),
      }),
    );
    expect(app.entryActionManager.register).toHaveBeenCalledWith(
      'notification-in-app-message:inbox:action-panel',
      expect.objectContaining({
        scope: 'action-panel',
        sort: 310,
        provider: expect.any(Function),
      }),
    );

    const provider = app.entryActionManager.register.mock.calls.find(
      ([name]) => name === 'notification-in-app-message:inbox:action-panel',
    )?.[1].provider;
    const items = await provider({});

    expect(items).toEqual([
      expect.objectContaining({
        key: 'notification-in-app-message:inbox',
        label: 'Notification',
        createModelOptions: expect.objectContaining({
          use: 'NotificationEntryActionModel',
          props: expect.objectContaining({
            title: expect.stringContaining('Notification'),
            icon: 'BellOutlined',
          }),
          stepParams: expect.objectContaining({
            popupSettings: expect.objectContaining({
              openView: expect.objectContaining({
                mode: 'embed',
                pageModelClass: 'NotificationEmbeddedPageModel',
                showFlowSettings: false,
              }),
            }),
          }),
        }),
      }),
    ]);
  });
});
