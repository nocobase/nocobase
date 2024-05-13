/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { get } from 'lodash';

import { appendArrayColumn } from '..';

describe('evaluators > appendArrayColumn()', () => {
  it('simple array', () => {
    const scope = {
      a: [{ b: 1 }, { b: 2 }],
    };
    appendArrayColumn(scope, 'a.b');
    expect(get(scope, 'a.b')).toEqual([1, 2]);
  });

  it('nested array', () => {
    const scope = {
      a: [
        {
          b: [{ c: 1 }, { c: 2 }],
        },
        {
          b: [{ c: 3 }, { c: 4 }],
        },
      ],
    };
    appendArrayColumn(scope, 'a.b.c');
    const a_b: any = [{ c: 1 }, { c: 2 }, { c: 3 }, { c: 4 }];
    a_b.c = [1, 2, 3, 4];
    expect(get(scope, 'a.b')).toEqual(a_b);
    expect(get(scope, 'a.b.c')).toEqual([1, 2, 3, 4]);
  });

  it('nested object array', () => {
    const scope = {
      a: {
        b: { c: [{ d: 1 }, { d: 2 }] },
      },
    };
    appendArrayColumn(scope, 'a.b.c.d');
    expect(get(scope, 'a.b.c.d')).toEqual([1, 2]);
  });
});
