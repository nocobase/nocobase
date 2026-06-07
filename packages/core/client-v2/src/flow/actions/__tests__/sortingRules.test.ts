/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { sortingRule } from '../sortingRules';

describe('sortingRule', () => {
  it('should not throw when the block collection is unavailable', () => {
    const schema = sortingRule.uiSchema({
      blockModel: {
        collection: undefined,
      },
    } as any);

    expect(schema.sort.items.properties.space.properties.field.enum).toEqual([]);
  });
});
