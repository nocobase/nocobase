/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NumberValueParser } from '../../value-parsers';

describe('number value parser', () => {
  let parser: NumberValueParser;

  beforeEach(() => {
    parser = new NumberValueParser({}, {});
  });

  const expectValue = (value) => {
    parser = new NumberValueParser({}, {});
    parser.setValue(value);
    return expect(parser.getValue());
  };

  it('should be number', () => {
    expectValue(123).toBe(123);
    expect(parser.errors.length === 0).toBeTruthy();
    expectValue('123').toBe(123);
    expect(parser.errors.length === 0).toBeTruthy();
    expectValue('123%').toBe(1.23);
    expect(parser.errors.length === 0).toBeTruthy();
    expectValue('22.5507%').toBe(0.225507);
    expect(parser.errors.length === 0).toBeTruthy();
    expectValue('2,122,121,122').toBe(2122121122);
    expect(parser.errors.length === 0).toBeTruthy();
    expectValue('2,122,121,122.5507').toBe(2122121122.5507);
    expect(parser.errors.length === 0).toBeTruthy();
    expectValue('11,122.5507%').toBe(111.225507);
    expect(parser.errors.length === 0).toBeTruthy();
  });

  it('should be null', () => {
    expectValue('').toBe(null);
    expect(parser.errors.length === 0).toBeTruthy();
    expectValue('n/a').toBe(null);
    expect(parser.errors.length === 0).toBeTruthy();
    expectValue('-').toBe(null);
    expect(parser.errors.length === 0).toBeTruthy();
  });

  it('should be errors', () => {
    expectValue({}).toBe(null);
    expect(parser.errors.length > 0).toBeTruthy();
    expectValue('123a').toBe(null);
    expect(parser.errors.length > 0).toBeTruthy();
    expectValue('123a%').toBe(null);
    expect(parser.errors.length > 0).toBeTruthy();
    expectValue('aaa').toBe(null);
    expect(parser.errors.length > 0).toBeTruthy();
  });
});
