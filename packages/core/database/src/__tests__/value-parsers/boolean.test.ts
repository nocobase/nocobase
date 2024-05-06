/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BooleanValueParser } from '../../value-parsers';

describe('boolean value parser', () => {
  let parser: BooleanValueParser;

  beforeEach(() => {
    parser = new BooleanValueParser({}, {});
  });

  const expectValue = (value) => {
    parser = new BooleanValueParser({}, {});
    parser.setValue(value);
    return expect(parser.getValue());
  };

  test('falsy value', async () => {
    expectValue('n').toBe(false);
    expectValue('false').toBe(false);
    expectValue('0').toBe(false);
    expectValue('false').toBe(false);
    expectValue(false).toBe(false);
    expectValue(0).toBe(false);
  });

  test('truthy value', async () => {
    expectValue('y').toBe(true);
    expectValue('true').toBe(true);
    expectValue('1').toBe(true);
    expectValue('yes').toBe(true);
    expectValue(true).toBe(true);
    expectValue(1).toBe(true);
  });
});
