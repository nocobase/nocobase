/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { MBMFieldInterface, PluginM2MArrayClient } from '../index';

describe('PluginM2MArrayClient', () => {
  it('registers the many-to-many array field interface', async () => {
    const addFieldInterfaces = vi.fn();
    const plugin = Object.create(PluginM2MArrayClient.prototype) as PluginM2MArrayClient & {
      app: {
        addFieldInterfaces: typeof addFieldInterfaces;
      };
    };
    plugin.app = {
      addFieldInterfaces,
    };

    await plugin.load();

    expect(addFieldInterfaces).toHaveBeenCalledWith([MBMFieldInterface]);
  });
});
