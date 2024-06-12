/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  Application,
  CollectionFieldInterface,
  DEFAULT_DATA_SOURCE_KEY,
  isTitleField,
  useDataSourceHeaders,
} from '@nocobase/client';
import { renderHook } from '@nocobase/test/client';

import collections from './collections.json';

describe('utils', () => {
  describe('isTitleField', () => {
    class Demo1FieldInterface extends CollectionFieldInterface {
      name = 'demo1';
      titleUsable = false;
    }
    class Demo2FieldInterface extends CollectionFieldInterface {
      name = 'demo2';
      titleUsable = true;
    }

    const dm = new Application({
      dataSourceManager: {
        collections: collections as any,
        fieldInterfaces: [Demo1FieldInterface, Demo2FieldInterface],
      },
    }).dataSourceManager;

    it('should return false when field is foreign key', () => {
      const field = {
        isForeignKey: true,
      };
      expect(isTitleField(dm, field)).toBeFalsy();
    });

    it('should return false when field interface is not title usable', () => {
      const field = {
        isForeignKey: false,
        interface: 'demo1',
      };
      expect(isTitleField(dm, field)).toBeFalsy();
    });

    it('should return true when field is not foreign key and field interface is title usable', () => {
      const field = {
        isForeignKey: false,
        interface: 'demo2',
      };
      expect(isTitleField(dm, field)).toBeTruthy();
    });
  });

  describe('useDataSourceHeaders', () => {
    test('should return undefined when dataSource is not provided', () => {
      const { result } = renderHook(() => useDataSourceHeaders());

      expect(result.current).toBeUndefined();
    });

    test('should return undefined when dataSource is the default key', () => {
      const { result } = renderHook(() => useDataSourceHeaders(DEFAULT_DATA_SOURCE_KEY));

      expect(result.current).toBeUndefined();
    });

    test('should return correct headers when dataSource is provided and not the default key', () => {
      const dataSource = 'customDataSource';
      const { result } = renderHook(() => useDataSourceHeaders(dataSource));

      expect(result.current).toEqual({ 'x-data-source': dataSource });
    });

    test('should return undefined when dataSource is an empty string', () => {
      const { result } = renderHook(() => useDataSourceHeaders(''));

      expect(result.current).toBeUndefined();
    });

    test('should return undefined when dataSource is null', () => {
      // This test will always pass in TypeScript since the type doesn't allow null, but included for comprehensive testing if the dataSource type changes.
      const { result } = renderHook(() => useDataSourceHeaders(null as unknown as string));

      expect(result.current).toBeUndefined();
    });

    test('should handle dataSource change', () => {
      const { result, rerender } = renderHook(({ dataSource }) => useDataSourceHeaders(dataSource), {
        initialProps: { dataSource: 'initialDataSource' },
      });

      expect(result.current).toEqual({ 'x-data-source': 'initialDataSource' });

      // Change the dataSource prop
      rerender({ dataSource: 'updatedDataSource' });
      expect(result.current).toEqual({ 'x-data-source': 'updatedDataSource' });
    });
  });
});
