/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearFieldMenuItemProviders,
  registerFieldMenuItemProvider,
  resolveFieldMenuItems,
  type FieldMenuSurface,
} from '../../..';

class TestFieldMenuModel extends FlowModel {}

describe('field menu item providers', () => {
  afterEach(() => {
    clearFieldMenuItemProviders();
  });

  it.each<FieldMenuSurface>(['form-field', 'details-field', 'filter-form-field', 'table-column'])(
    'passes the %s surface and previously resolved items to providers',
    async (surface) => {
      const engine = new FlowEngine();
      engine.registerModels({ TestFieldMenuModel });
      const model = engine.createModel<TestFieldMenuModel>({ use: 'TestFieldMenuModel' });
      const secondProvider = vi.fn(({ surface: currentSurface, model: currentModel, items }) => {
        expect(currentSurface).toBe(surface);
        expect(currentModel).toBe(model);
        expect(items.map((item) => item.key)).toEqual(['initial', 'first-provider']);
        return { key: 'second-provider', sort: 10 };
      });

      registerFieldMenuItemProvider('first', () => ({ key: 'first-provider', sort: 30 }));
      registerFieldMenuItemProvider('second', secondProvider);

      const items = await resolveFieldMenuItems({
        surface,
        model,
        ctx: model.context,
        items: [{ key: 'initial', sort: 20 }],
      });

      expect(items.map((item) => item.key)).toEqual(['second-provider', 'initial', 'first-provider']);
      expect(secondProvider).toHaveBeenCalledOnce();
    },
  );

  it('only removes the provider instance owned by its disposer', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ TestFieldMenuModel });
    const model = engine.createModel<TestFieldMenuModel>({ use: 'TestFieldMenuModel' });
    const disposeFirst = registerFieldMenuItemProvider('shared-key', () => ({ key: 'first' }));
    registerFieldMenuItemProvider('shared-key', () => ({ key: 'second' }));

    disposeFirst();
    const items = await resolveFieldMenuItems({ surface: 'form-field', model, ctx: model.context });

    expect(items.map((item) => item.key)).toEqual(['second']);
  });
});
