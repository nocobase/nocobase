/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { bulkEditFieldComponent } from '../flow/bulkEditFieldComponent';
import { bulkEditTitleField } from '../flow/bulkEditTitleField';
import { PluginActionBulkEditClient } from '../index';

describe('PluginActionBulkEditClient', () => {
  it('registers bulk edit actions and model loaders', async () => {
    const registerActions = vi.fn();
    const registerModelLoaders = vi.fn();
    const plugin = Object.create(PluginActionBulkEditClient.prototype) as PluginActionBulkEditClient & {
      app: {
        flowEngine: {
          registerActions: typeof registerActions;
          registerModelLoaders: typeof registerModelLoaders;
        };
      };
    };
    plugin.app = {
      flowEngine: {
        registerActions,
        registerModelLoaders,
      },
    };

    await plugin.load();

    expect(registerActions).toHaveBeenCalledWith({
      bulkEditTitleField,
      bulkEditFieldComponent,
    });
    expect(registerModelLoaders).toHaveBeenCalledWith(
      expect.objectContaining({
        BulkEditActionModel: expect.objectContaining({ extends: 'ActionModel' }),
        BulkEditFormModel: expect.objectContaining({ extends: 'CreateFormModel' }),
        BulkEditFormItemModel: expect.objectContaining({ extends: 'FormItemModel' }),
        BulkEditFieldModel: expect.objectContaining({ extends: 'FieldModel' }),
        BulkEditFormSubmitActionModel: expect.objectContaining({ extends: 'ActionModel' }),
        BulkEditDataBlockModel: expect.objectContaining({ extends: 'DataBlockModel' }),
      }),
    );

    const loaders = registerModelLoaders.mock.calls[0][0];
    await expect(loaders.BulkEditActionModel.loader()).resolves.toHaveProperty('BulkEditActionModel');
    await expect(loaders.BulkEditFormSubmitActionModel.loader()).resolves.toHaveProperty(
      'BulkEditFormSubmitActionModel',
    );
  });
});
