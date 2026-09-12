/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowModelContext, MultiRecordResource } from '@nocobase/flow-engine';
import { describe, expect, it } from 'vitest';
import { CollectionBlockModel } from '../CollectionBlockModel';

class AddAppendsCollectionBlockModel extends CollectionBlockModel {
  createResource(ctx: FlowModelContext) {
    return ctx.createResource(MultiRecordResource);
  }
}

describe('CollectionBlockModel addAppends', () => {
  it('does not throw for a nested field path when the collection is unavailable', () => {
    const engine = new FlowEngine();
    engine.registerModels({ AddAppendsCollectionBlockModel });

    const model = engine.createModel<AddAppendsCollectionBlockModel>({
      uid: 'missing-collection-add-appends-block',
      use: 'AddAppendsCollectionBlockModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'missing_collection',
          },
        },
      },
    });

    expect(model.collection).toBeUndefined();
    expect(() => model.addAppends('createdBy.departments')).not.toThrow();
  });
});
