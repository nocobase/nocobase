/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { PrintActionModel } from '../../client-v2/PrintActionModel';
import { PluginActionPrintClient } from '../index';

describe('PluginActionPrintClient', () => {
  it('registers PrintActionModel for v1 pages', async () => {
    const registerModels = vi.fn();
    const plugin = Object.create(PluginActionPrintClient.prototype) as PluginActionPrintClient;
    Object.defineProperty(plugin, 'app', {
      value: {
        use: vi.fn(),
        schemaSettingsManager: {
          add: vi.fn(),
        },
        schemaInitializerManager: {
          addItem: vi.fn(),
        },
        flowEngine: {
          registerModels,
        },
      },
    });

    await plugin.load();

    expect(registerModels).toHaveBeenCalledWith({ PrintActionModel });
  });
});
