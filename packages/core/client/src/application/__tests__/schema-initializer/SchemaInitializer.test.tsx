/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaInitializer } from '@nocobase/client';

describe('SchemaInitializer', () => {
  let initializer: SchemaInitializer;

  beforeEach(() => {
    initializer = new SchemaInitializer({ name: 'test' });
  });

  test('initializes with default options if none are provided', () => {
    expect(initializer).toBeDefined();
    expect(initializer.name).toEqual('test');
    expect(initializer.items).toEqual([]);
  });

  test('adds an item', () => {
    initializer.add('item1', { title: 'title' });
    expect(initializer.items).toEqual([{ name: 'item1', title: 'title' }]);
  });

  test('updates an item if it already exists', () => {
    initializer.add('item1', { title: 'title' });
    initializer.add('item1', { title: 'new title' });
    expect(initializer.items).toEqual([{ name: 'item1', title: 'new title' }]);
  });

  test('adds a nested item', () => {
    initializer.add('parent', { title: 'parent title' });
    initializer.add('parent.item1', { title: 'item1 title' });
    expect(initializer.get('parent')).toEqual({
      name: 'parent',
      title: 'parent title',
      children: [{ name: 'item1', title: 'item1 title' }],
    });
  });

  // 为了能让旧版插件代码正常工作（操作按钮拍平后：https://nocobase.feishu.cn/wiki/O7pjwSbBEigpOWkY9s5c03Yenkh），需要满足下面的测试用例
  test('add an item with nested name', () => {
    // 等同于 initializer.add('item1', { title: 'item1 title' });
    initializer.add('parent.item1', { title: 'item1 title' });

    // 等同于 initializer.get('item1')
    expect(initializer.get('parent.item1')).toEqual({
      name: 'item1',
      title: 'item1 title',
    });
    expect(initializer.get('item1')).toEqual({
      name: 'item1',
      title: 'item1 title',
    });
    expect(initializer.get('parent')).toBe(undefined);
  });

  test('updates a nested item if it already exists', () => {
    initializer.add('parent', { title: 'parent title' });
    initializer.add('parent.item1', { title: 'title' });
    initializer.add('parent.item1', { title: 'new title' });
    expect(initializer.get('parent')).toEqual({
      name: 'parent',
      title: 'parent title',
      children: [{ name: 'item1', title: 'new title' }],
    });
  });

  test('gets an item', () => {
    initializer.add('item1', { title: 'title' });
    expect(initializer.get('item1')).toEqual({ name: 'item1', title: 'title' });
    expect(initializer.get('no-exist')).toEqual(undefined);
    expect(initializer.get(undefined)).toEqual(undefined);
  });

  test('gets a nested item', () => {
    initializer.add('parent', { title: 'parent title' });
    initializer.add('parent.item1', { title: 'title' });
    expect(initializer.get('parent.item1')).toEqual({
      name: 'item1',
      title: 'title',
    });
    expect(initializer.get('parent.item1.not-exist')).toEqual(undefined);
    expect(initializer.get('parent.not-exist')).toEqual(undefined);
    expect(initializer.get('parent.not-exist.not-exist')).toEqual(undefined);
  });

  test('returns undefined for a non-existent item', () => {
    expect(initializer.get('nonExistent')).toBeUndefined();
  });

  test('removes an item', () => {
    initializer.add('item1', { title: 'title' });
    initializer.remove('item1');
    expect(initializer.items).toEqual([]);
  });

  test('removes a nested item', () => {
    initializer.add('parent', { title: 'title' });
    initializer.add('parent.item1', { title: 'title' });
    initializer.remove('parent');
    expect(initializer.get('parent')).toEqual(undefined);
    expect(initializer.get('parent.item1')).toEqual(undefined);
  });

  test('removes a nested child item', () => {
    initializer.add('parent', { title: 'title' });
    initializer.add('parent.item1', { title: 'title' });
    initializer.remove('parent.item1');
    expect(initializer.get('parent')).toBeDefined();
    expect(initializer.get('parent.item1')).toEqual(undefined);
  });

  test('does nothing when removing a non-existent item', () => {
    const initialItems = [...initializer.items];
    initializer.remove('nonExistent');
    expect(initializer.items).toEqual(initialItems);
  });
});
