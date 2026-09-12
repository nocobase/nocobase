/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient } from '@nocobase/client-v2';
import PluginUsersClientV2 from '../plugin';

describe('plugin-users client-v2 user center item models', () => {
  it('registers and hides change password when system settings disable it', async () => {
    const app = createMockClient({});
    await app.pm.add(PluginUsersClientV2);
    await app.load();

    const ChangePasswordItemModel = await app.flowEngine.getModelClassAsync('ChangePasswordItemModel');
    const model = app.flowEngine.createModel({ use: 'ChangePasswordItemModel', uid: 'change-password' }) as any;

    expect(ChangePasswordItemModel).toBeTruthy();

    model.context.defineProperty('systemSettings', {
      value: {
        load: vi.fn().mockResolvedValue({ data: { enableChangePassword: false } }),
      },
    });

    await model.prepare();

    expect(model.ready).toBe(false);
  });

  it('opens change password drawer when clicked', async () => {
    const app = createMockClient({});
    await app.pm.add(PluginUsersClientV2);
    await app.load();

    await app.flowEngine.getModelClassAsync('ChangePasswordItemModel');
    const model = app.flowEngine.createModel({ use: 'ChangePasswordItemModel', uid: 'change-password' }) as any;
    const open = vi.fn();

    model.context.defineProperty('viewer', {
      value: {
        open,
      },
    });

    await model.onClick();

    expect(open).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'drawer',
        width: '50%',
        closable: true,
      }),
    );
  });

  it('uses nickname, username, then email for current user summary', async () => {
    const app = createMockClient({});
    await app.pm.add(PluginUsersClientV2);
    await app.load();

    await app.flowEngine.getModelClassAsync('CurrentUserSummaryItemModel');
    const model = app.flowEngine.createModel({
      use: 'CurrentUserSummaryItemModel',
      uid: 'current-user-summary',
    }) as any;

    model.context.defineProperty('user', {
      value: {
        nickname: '',
        username: 'alice',
        email: 'alice@example.com',
      },
    });

    await model.prepare();

    expect(model.label).toBe('alice');
    expect(model.value).toBeUndefined();
    expect(model.description).toBeUndefined();
    expect(model.ready).toBe(true);
  });
});
