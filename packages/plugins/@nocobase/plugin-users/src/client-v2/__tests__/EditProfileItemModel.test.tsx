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

describe('EditProfileItemModel', () => {
  it('should be registered and honor system settings visibility', async () => {
    const app = createMockClient({});
    await app.pm.add(PluginUsersClientV2);
    await app.load();

    const EditProfileItemModel = await app.flowEngine.getModelClassAsync('EditProfileItemModel');
    const model = app.flowEngine.createModel({ use: 'EditProfileItemModel', uid: 'edit-profile' }) as any;

    expect(EditProfileItemModel).toBeTruthy();

    model.context.defineProperty('systemSettings', {
      value: {
        load: vi.fn().mockResolvedValue({ data: { enableEditProfile: false } }),
      },
    });

    await model.prepare();

    expect(model.ready).toBe(false);
  });

  it('should open drawer when clicked', async () => {
    const app = createMockClient({});
    await app.pm.add(PluginUsersClientV2);
    await app.load();

    await app.flowEngine.getModelClassAsync('EditProfileItemModel');
    const model = app.flowEngine.createModel({ use: 'EditProfileItemModel', uid: 'edit-profile' }) as any;
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
});
