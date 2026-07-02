/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { AttachmentURLFieldInterface, AttachmentURLFieldModel, PluginFieldAttachmentUrlClient } from '../index';

describe('PluginFieldAttachmentUrlClient', () => {
  it('registers the attachment URL interface and field model loader', async () => {
    const addFieldInterfaces = vi.fn();
    const registerModelLoaders = vi.fn();
    const plugin = Object.create(PluginFieldAttachmentUrlClient.prototype) as PluginFieldAttachmentUrlClient & {
      app: {
        addFieldInterfaces: typeof addFieldInterfaces;
        flowEngine: {
          registerModelLoaders: typeof registerModelLoaders;
        };
      };
    };
    plugin.app = {
      addFieldInterfaces,
      flowEngine: {
        registerModelLoaders,
      },
    };

    await plugin.load();

    expect(addFieldInterfaces).toHaveBeenCalledWith([AttachmentURLFieldInterface]);
    expect(registerModelLoaders).toHaveBeenCalledWith({
      AttachmentURLFieldModel: {
        loader: expect.any(Function),
      },
    });

    const loaders = registerModelLoaders.mock.calls[0][0];
    await expect(loaders.AttachmentURLFieldModel.loader()).resolves.toHaveProperty(
      'AttachmentURLFieldModel',
      AttachmentURLFieldModel,
    );
  });
});
