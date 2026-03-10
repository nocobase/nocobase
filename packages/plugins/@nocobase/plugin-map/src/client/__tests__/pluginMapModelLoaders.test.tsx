/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application } from '@nocobase/client';
import { describe, expect, it } from 'vitest';
import PluginMapClient from '../index';

describe('PluginMapClient model loader pilot', () => {
  it('keeps MapBlockModel eager and resolves MapActionGroupModel through design-mode preload', async () => {
    const app = new Application({
      plugins: [[PluginMapClient, { name: 'map', packageName: '@nocobase/plugin-map' }]],
    });

    await app.load();

    expect(app.flowEngine.getModelClass('MapBlockModel')).toBeDefined();
    expect(app.flowEngine.getModelClass('MapActionGroupModel')).toBeUndefined();
    expect((app.flowEngine as any)._modelEntries.has('MapActionGroupModel')).toBe(true);

    await app.flowEngine.prepareDesignMode();

    expect(app.flowEngine.getModelClass('MapActionGroupModel')).toBeDefined();
  });
});
