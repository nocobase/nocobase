/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { StringValueParser } from '../../value-parsers';

describe('array value parser', () => {
  let parser: StringValueParser;

  beforeEach(() => {
    parser = new StringValueParser({}, {});
  });

  const expectValue = (value) => {
    parser = new StringValueParser({}, {});
    parser.setValue(value);
    return expect(parser.getValue());
  };

  test('string value parser', async () => {
    expectValue('{"a":1}').toEqual('{"a":1}');
    expectValue('{"a":1,"b":2}').toEqual('{"a":1,"b":2}');
    expectValue('{"a":1,"b":2,"c":3}').toEqual('{"a":1,"b":2,"c":3}');
  });
});
