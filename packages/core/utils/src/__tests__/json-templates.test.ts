/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { parse } from '../json-templates';

describe('json-templates', () => {
  it('parse json with string template', async () => {
    const template = {
      name: '{{id}}-{{name}}.',
      age: 18,
    };
    const result = parse(template)({
      name: 'test',
      id: 1,
    });
    expect(result).toEqual({
      name: '1-test.',
      age: 18,
    });
  });
});

describe('json-templates filters', () => {
  it('date filters', async () => {
    const template = {
      today: '{{now | date_format: "YYYY-MM-DD"}}',
      yesterday: '{{now | date_subtract: 1, "day" | date_format: "YYYY-MM-DD"}}',
    };

    const compiledFn = parse(template);
    compiledFn.parameters.some((parameter) => parameter.key === 'now');
    const result = compiledFn({
      now: new Date('2025-01-01: 12:00:00'),
    });
    expect(result).toEqual({
      today: '2025-01-01',
      yesterday: '2024-12-31',
    });
  });

  it('multiple level accessiong', async () => {
    const template = {
      user: '{{user.name}}',
      firstOfArray1: '{{array.0}}',
      firstOfArray2: '{{array[0]}}',
    };
    const result = parse(template)({
      user: { name: 'john' },
      array: ['first', 'second'],
    });
    expect(result).toEqual({
      user: 'john',
      firstOfArray1: 'first',
      firstOfArray2: 'first',
    });
  });

  it('when key is undefined, ignore it', async () => {
    const template = {
      key1: '{{current.key1}}',
      key2: '{{current.key2}}',
    };
    const result = parse(template)({
      current: { key1: 'value1', key2: undefined },
    });
    expect(result).toEqual({
      key1: 'value1',
      key2: '',
    });
  });
});
