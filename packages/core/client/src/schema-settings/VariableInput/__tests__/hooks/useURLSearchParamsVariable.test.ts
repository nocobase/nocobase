/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getURLSearchParamsChildren } from '../../hooks/useURLSearchParamsVariable';

test('getURLSearchParamsChildren should return an array of options with expected properties', () => {
  const queryParams = {
    param1: 'value1',
    param2: 'value2',
    param3: 'value3',
  };

  const result = getURLSearchParamsChildren(queryParams);

  expect(result).toEqual([
    {
      label: 'param1',
      value: 'param1',
      key: 'param1',
      isLeaf: true,
    },
    {
      label: 'param2',
      value: 'param2',
      key: 'param2',
      isLeaf: true,
    },
    {
      label: 'param3',
      value: 'param3',
      key: 'param3',
      isLeaf: true,
    },
  ]);
});
