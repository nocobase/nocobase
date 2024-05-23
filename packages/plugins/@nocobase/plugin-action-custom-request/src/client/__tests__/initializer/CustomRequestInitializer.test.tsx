/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getNewSchema } from '../../initializer/CustomRequestInitializer';

describe('CustomRequestInitializer', () => {
  it('should generate a new schema with different x-uid each time', () => {
    const schema1 = getNewSchema();
    const schema2 = getNewSchema();
    expect(schema1['x-uid']).not.toBe(schema2['x-uid']);
  });
});
