/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isObservable } from '@formily/reactive';
import { renderHook } from '@nocobase/test/client';
import {
  getURLSearchParams,
  getURLSearchParamsChildren,
  useURLSearchParamsCtx,
} from '../../hooks/useURLSearchParamsVariable';

test('getURLSearchParamsChildren should return an array of options with expected properties', () => {
  const queryParams = {
    param1: 'value1',
    param2: 'value2',
    param3: 'value3',
  };

  const result = getURLSearchParamsChildren(queryParams);

  expect(result).toMatchObject([
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

test('getURLSearchParams should parse search string and return params object', () => {
  const search = '?param1=value1&param2=value2&param3=value3';
  const expectedParams = {
    param1: 'value1',
    param2: 'value2',
    param3: 'value3',
  };

  const result = getURLSearchParams(search);

  expect(result).toEqual(expectedParams);
});

test('useURLSearchParamsCtx should return the parsed search params object', () => {
  const search = '?param1=value1&param2=value2&param3=value3';
  const { result } = renderHook(() => useURLSearchParamsCtx(search));

  expect(result.current).toEqual({
    param1: 'value1',
    param2: 'value2',
    param3: 'value3',
  });
  expect(isObservable(result.current)).toBe(true);
});

test('useURLSearchParamsCtx should update the parsed search params object when search value changes', () => {
  const { result, rerender } = renderHook(({ search }) => useURLSearchParamsCtx(search), {
    initialProps: {
      search: '?param1=value1&param2=value2&param3=value3',
    },
  });
  expect(result.current).toEqual({
    param1: 'value1',
    param2: 'value2',
    param3: 'value3',
  });

  rerender({
    search: '?param1=newValue1&param2=newValue2',
  });
  expect(result.current).toEqual({
    param1: 'newValue1',
    param2: 'newValue2',
  });

  rerender({
    search: '',
  });
  expect(result.current).toEqual({});
});
