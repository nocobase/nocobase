/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionModel } from '@nocobase/client-v2';
import { describe, expect, it } from 'vitest';
import { ListBlockModel } from '../ListBlockModel';

class TestDestroyManyActionModel extends ActionModel {
  static capabilityActionName = 'destroyMany';
}

class TestUpdateManyActionModel extends ActionModel {
  static capabilityActionName = 'updateMany';
}

class TestCollectionActionModel extends ActionModel {}

class TestCollectionActionGroupModel {
  static async defineChildren() {
    return [
      { key: 'destroy', useModel: 'TestDestroyManyActionModel' },
      { key: 'update', useModel: 'TestUpdateManyActionModel' },
      { key: 'normal', useModel: 'TestCollectionActionModel' },
    ];
  }
}

const createMenuContext = () =>
  ({
    engine: {
      getModelClass: (name: string) =>
        ({
          TestCollectionActionGroupModel,
          TestDestroyManyActionModel,
          TestUpdateManyActionModel,
          TestCollectionActionModel,
        })[name],
    },
  }) as any;

describe('ListBlockModel action menu', () => {
  it('does not offer collection actions that require selected records', async () => {
    const model = Object.create(ListBlockModel.prototype) as ListBlockModel;
    Object.defineProperty(model, 'getModelClassName', {
      configurable: true,
      value: () => 'TestCollectionActionGroupModel',
    });

    const items = await model.getCollectionActionItems(createMenuContext());

    expect(items.map((item) => item.key)).toEqual(['normal']);
  });
});
