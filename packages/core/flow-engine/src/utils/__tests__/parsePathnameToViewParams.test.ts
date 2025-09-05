/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { parsePathnameToViewParams } from '../parsePathnameToViewParams';

describe('parsePathnameToViewParams', () => {
  test('should return single view param for basic admin path', () => {
    const result = parsePathnameToViewParams('/admin/xxx');
    expect(result).toEqual([{ viewUid: 'xxx' }]);
  });

  test('should return view param with tab for admin path with tab', () => {
    const result = parsePathnameToViewParams('/admin/xxx/tab/yyy');
    expect(result).toEqual([{ viewUid: 'xxx', tabUid: 'yyy' }]);
  });

  test('should return two view params for admin with view', () => {
    const result = parsePathnameToViewParams('/admin/xxx/view/yyy');
    expect(result).toEqual([{ viewUid: 'xxx' }, { viewUid: 'yyy' }]);
  });

  test('should return two view params with second having tab', () => {
    const result = parsePathnameToViewParams('/admin/xxx/view/yyy/tab/zzz');
    expect(result).toEqual([{ viewUid: 'xxx' }, { viewUid: 'yyy', tabUid: 'zzz' }]);
  });

  test('should handle complex path with admin tab and view tab', () => {
    const result = parsePathnameToViewParams('/admin/xxx/tab/yyy/view/zzz/tab/aaa');
    expect(result).toEqual([
      { viewUid: 'xxx', tabUid: 'yyy' },
      { viewUid: 'zzz', tabUid: 'aaa' },
    ]);
  });

  test('should handle view with filterByTk parameter', () => {
    const result = parsePathnameToViewParams('/admin/xxx/view/yyy/filterbytk/1');
    expect(result).toEqual([{ viewUid: 'xxx' }, { viewUid: 'yyy', filterByTk: '1' }]);
  });

  test('should handle view with filterByTk and sourceId parameters', () => {
    const result = parsePathnameToViewParams('/admin/xxx/view/yyy/filterbytk/1/sourceid/1');
    expect(result).toEqual([{ viewUid: 'xxx' }, { viewUid: 'yyy', filterByTk: '1', sourceId: '1' }]);
  });

  test('should handle multiple views with different filterByTk and sourceId', () => {
    const result = parsePathnameToViewParams(
      '/admin/xxx/view/yyy/filterbytk/1/sourceid/1/view/zzz/filterbytk/2/sourceid/2',
    );
    expect(result).toEqual([
      { viewUid: 'xxx' },
      { viewUid: 'yyy', filterByTk: '1', sourceId: '1' },
      { viewUid: 'zzz', filterByTk: '2', sourceId: '2' },
    ]);
  });

  test('should handle complex path with tab, filterByTk and sourceId', () => {
    const result = parsePathnameToViewParams(
      '/admin/xxx/view/yyy/tab/zzz/filterbytk/1/sourceid/1/view/aaa/filterbytk/2/sourceid/2',
    );
    expect(result).toEqual([
      { viewUid: 'xxx' },
      { viewUid: 'yyy', filterByTk: '1', sourceId: '1', tabUid: 'zzz' },
      { viewUid: 'aaa', filterByTk: '2', sourceId: '2' },
    ]);
  });

  test('should return empty array for empty pathname', () => {
    expect(parsePathnameToViewParams('')).toEqual([]);
    expect(parsePathnameToViewParams('/')).toEqual([]);
  });

  test('should return empty array for invalid pathname', () => {
    expect(parsePathnameToViewParams('/admin')).toEqual([]);
    expect(parsePathnameToViewParams('/invalid')).toEqual([]);
  });

  test('should handle different parameter orders', () => {
    const result1 = parsePathnameToViewParams('/admin/xxx/tab/yyy/filterbytk/1/sourceid/2');
    const result2 = parsePathnameToViewParams('/admin/xxx/filterbytk/1/tab/yyy/sourceid/2');
    const result3 = parsePathnameToViewParams('/admin/xxx/sourceid/2/filterbytk/1/tab/yyy');

    const expected = [{ viewUid: 'xxx', tabUid: 'yyy', filterByTk: '1', sourceId: '2' }];

    expect(result1).toEqual(expected);
    expect(result2).toEqual(expected);
    expect(result3).toEqual(expected);
  });

  test('should ignore unknown parameters', () => {
    const result = parsePathnameToViewParams('/admin/xxx/unknown/value/tab/yyy');
    expect(result).toEqual([{ viewUid: 'xxx', tabUid: 'yyy' }]);
  });

  test('should handle paths with extra slashes', () => {
    const result = parsePathnameToViewParams('///admin//xxx//tab//yyy//');
    expect(result).toEqual([{ viewUid: 'xxx', tabUid: 'yyy' }]);
  });
});
