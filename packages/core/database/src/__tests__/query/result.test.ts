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

  it('should normalize unformatted date result to Date', () => {
    const result = normalizeQueryResult([{ createdAt: '2023-01-01 00:00:00.000 +00:00' }], {
      createdAt: { type: 'date' },
    });

    expect(result[0].createdAt).toBeInstanceOf(Date);
    expect(result[0].createdAt.toISOString()).toBe('2023-01-01T00:00:00.000Z');
  });

  it('should keep formatted date result as string', () => {
    expect(
      normalizeQueryResult([{ createdAt: '2023-01' }], {
        createdAt: { type: 'date', format: 'YYYY-MM' },
      }),
    ).toEqual([{ createdAt: '2023-01' }]);
  });

  it('should keep dateOnly result as string', () => {
    expect(
      normalizeQueryResult([{ dateOnly: '2024-05-14' }], {
        dateOnly: { type: 'dateOnly' },
      }),
    ).toEqual([{ dateOnly: '2024-05-14' }]);
  });
});
