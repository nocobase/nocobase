/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { describe, it, expect, vi } from 'vitest';
import { ReferenceFormGridModel } from '../ReferenceFormGridModel';

class MockFormBlockModel extends FlowModel {}
class MockGridModel extends FlowModel {}
class MockFieldModel extends FlowModel {}

describe('ReferenceFormGridModel', () => {
  it('proxies subModels to template grid but serializes as leaf', async () => {
    const engine = new FlowEngine();
    const store: Record<string, any> = {
      'tpl-root': {
        uid: 'tpl-root',
        use: 'FormBlockModel',
        subModels: {
          grid: {
            uid: 'tpl-grid',
            use: 'GridModel',
            subKey: 'grid',
            subType: 'object',
            subModels: {
              items: [
                { uid: 'tpl-f1', use: 'FieldModel', subKey: 'items', subType: 'array' },
                { uid: 'tpl-f2', use: 'FieldModel', subKey: 'items', subType: 'array' },
              ],
            },
          },
        },
      },
    };

    const clone = (obj: any) => JSON.parse(JSON.stringify(obj));
    const mockRepository = {
      findOne: vi.fn(async (query) => {
        const data = store[query.uid];
        return data ? clone(data) : null;
      }),
      save: vi.fn(async (model) => ({ uid: typeof model?.uid === 'string' ? model.uid : (model?.uid as any) })),
      destroy: vi.fn(async () => true),
      move: vi.fn(async () => {}),
      duplicate: vi.fn(async () => null),
    };

    engine.setModelRepository(mockRepository as any);
    engine.registerModels({
      FormBlockModel: MockFormBlockModel,
      GridModel: MockGridModel,
      FieldModel: MockFieldModel,
      ReferenceFormGridModel,
    });

    const form = engine.createModel({
      uid: 'host-form',
      use: 'FormBlockModel',
    });

    const refGrid = engine.createModel({
      uid: 'host-grid',
      use: 'ReferenceFormGridModel',
      parentId: form.uid,
      subKey: 'grid',
      subType: 'object',
      stepParams: {
        referenceFormGridSettings: {
          target: {
            templateUid: 'tpl-1',
            targetUid: 'tpl-root',
            sourcePath: 'subModels.grid',
          },
        },
      },
    });
    form.setSubModel('grid', refGrid);

    await refGrid.dispatchEvent('beforeRender', undefined, { useCache: false });

    const items = ((refGrid as any).subModels as any)?.items as FlowModel[];
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(2);
    expect(items.map((m) => m.uid).sort()).toEqual(['tpl-f1', 'tpl-f2']);

    const serialized = refGrid.serialize();
    expect(serialized.subModels).toBeUndefined();
  });
});
