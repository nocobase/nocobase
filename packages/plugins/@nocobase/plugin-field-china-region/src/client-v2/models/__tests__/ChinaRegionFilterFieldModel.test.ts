/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { FilterableItemModel, FlowEngine } from '@nocobase/flow-engine';
import { ChinaRegionFilterFieldModel } from '../ChinaRegionFieldModel';

describe('ChinaRegionFilterFieldModel', () => {
  it('registers as the default filter model for chinaRegion fields', () => {
    const engine = new FlowEngine();
    engine.registerModels({ ChinaRegionFilterFieldModel });

    const binding = FilterableItemModel.getDefaultBindingByField(engine.context, {
      interface: 'chinaRegion',
    } as any);

    expect(binding?.modelName).toBe('ChinaRegionFilterFieldModel');
    expect(binding?.defaultProps).toMatchObject({
      fieldNames: {
        label: 'name',
        value: 'code',
      },
      labelInValue: true,
      multiple: false,
    });
  });

  it('uses the last selected region code as the filter value', () => {
    const engine = new FlowEngine();
    engine.registerModels({ ChinaRegionFilterFieldModel });

    const fieldModel = engine.createModel<ChinaRegionFilterFieldModel>({
      uid: 'china-region-filter-field',
      use: 'ChinaRegionFilterFieldModel',
      props: {
        fieldNames: {
          label: 'name',
          value: 'code',
        },
        value: [
          { code: '110000', name: '北京市', level: 1 },
          { code: '110100', name: '市辖区', level: 2 },
          { code: '110101', name: '东城区', level: 3 },
        ],
      },
    });

    expect(fieldModel.operator).toBe('$eq');
    expect(fieldModel.getFilterValue()).toBe('110101');
  });
});
