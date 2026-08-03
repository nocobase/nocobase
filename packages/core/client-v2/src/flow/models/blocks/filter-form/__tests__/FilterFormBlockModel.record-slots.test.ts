/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, type PropertyMetaFactory } from '@nocobase/flow-engine';
import { describe, expect, it } from 'vitest';
import { FilterFormBlockModel } from '../FilterFormBlockModel';

describe('FilterFormBlockModel record slots', () => {
  it('keeps every segment of a dotted association field name', async () => {
    const engine = new FlowEngine();
    const model = {
      form: {
        getFieldsValue: () => ({ 'scope.owner': { id: 9 } }),
      },
      subModels: {
        grid: {
          subModels: {
            items: [
              {
                props: { name: 'scope.owner' },
                collectionField: {
                  interface: 'm2o',
                  target: 'users',
                  targetCollection: { filterTargetKey: 'id', dataSourceKey: 'analytics' },
                  isAssociationField: () => true,
                },
              },
            ],
          },
        },
      },
      translate: (value: string) => value,
    };
    const createMeta = Reflect.get(
      FilterFormBlockModel.prototype,
      'createFormValuesMetaFactory',
    ) as () => PropertyMetaFactory;
    const meta = await createMeta.call(model)();
    const variablesParams = await meta?.buildVariablesParams?.(engine.context);

    expect(engine.context.buildServerContextParams({ formValues: variablesParams })).toEqual({
      'formValues.scope.owner': {
        collection: 'users',
        dataSourceKey: 'analytics',
        filterByTk: 9,
      },
    });
  });
});
