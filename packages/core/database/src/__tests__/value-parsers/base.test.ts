/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseValueParser as ValueParser } from '../../value-parsers';

describe('number value parser', () => {
  let parser: ValueParser;

  beforeEach(() => {
    parser = new ValueParser({}, {});
  });

  it('should be converted to an array', () => {
    expect(parser.toArr('A/B', '/')).toEqual(['A', 'B']);
    expect(parser.toArr('A,B')).toEqual(['A', 'B']);
    expect(parser.toArr('A, B')).toEqual(['A', 'B']);
    expect(parser.toArr('A， B')).toEqual(['A', 'B']);
    expect(parser.toArr('A, B ')).toEqual(['A', 'B']);
    expect(parser.toArr('A， B  ')).toEqual(['A', 'B']);
    expect(parser.toArr('A、 B')).toEqual(['A', 'B']);
    expect(parser.toArr('A ,, B')).toEqual(['A', 'B']);
  });
});
