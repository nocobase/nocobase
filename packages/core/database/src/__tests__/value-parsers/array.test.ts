/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayValueParser } from '@nocobase/database';

describe('array value parser', () => {
  let parser: ArrayValueParser;

  beforeEach(() => {
    parser = new ArrayValueParser({}, {});
  });

  const expectValue = (value) => {
    parser = new ArrayValueParser({}, {});
    parser.setValue(value);
    return expect(parser.getValue());
  };

  test('array value parser', async () => {
    expectValue('tag1').toEqual(['tag1']);
    expectValue('tag1,tag2').toEqual(['tag1', 'tag2']);
  });
});
