/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizeQueryResult } from '../../query/builder';

describe('query result', () => {
  it('should normalize numeric result', () => {
    expect(
      normalizeQueryResult([{ total: '123', name: 'u1' }], {
        total: { type: 'bigInt' },
        name: { type: 'string' },
      }),
    ).toEqual([{ total: 123, name: 'u1' }]);
  });

  it('should normalize zero numeric result', () => {
    expect(
      normalizeQueryResult([{ total: 0, count: '0', name: 'u1' }], {
        total: { type: 'bigInt' },
        count: { type: 'integer' },
        name: { type: 'string' },
      }),
    ).toEqual([{ total: 0, count: 0, name: 'u1' }]);
  });
});
