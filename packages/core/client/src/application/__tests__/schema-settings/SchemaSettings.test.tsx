/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaSettings } from '@nocobase/client';

describe('SchemaSettings', () => {
  let schemaSettings: SchemaSettings;

  beforeEach(() => {
    schemaSettings = new SchemaSettings({ name: 'test', items: [] });
  });

  test('schemaSettings with default options if none are provided', () => {
    expect(schemaSettings).toBeDefined();
    expect(schemaSettings.name).toEqual('test');
    expect(schemaSettings.items).toEqual([]);
  });

  test('adds an item', () => {
    schemaSettings.add('item1', { type: 'item' });
    expect(schemaSettings.items).toEqual([{ name: 'item1', type: 'item' }]);
  });

  test('updates an item if it already exists', () => {
    schemaSettings.add('item1', { type: 'item', componentProps: { title: '123' } });
    schemaSettings.add('item1', { type: 'item', componentProps: { title: '456' } });
    expect(schemaSettings.items).toEqual([{ name: 'item1', type: 'item', componentProps: { title: '456' } }]);
  });

  test('adds a nested item', () => {
    schemaSettings.add('parent', { type: 'itemGroup' });
    schemaSettings.add('parent.item1', { type: 'item' });
    expect(schemaSettings.get('parent')).toEqual({
      name: 'parent',
      type: 'itemGroup',
      children: [{ name: 'item1', type: 'item' }],
    });

    schemaSettings.add('parent.item1', { type: 'item', componentProps: { title: '123' } });
    expect(schemaSettings.get('parent')).toEqual({
      name: 'parent',
      type: 'itemGroup',
      children: [{ name: 'item1', type: 'item', componentProps: { title: '123' } }],
    });
  });

  test('gets an item', () => {
    schemaSettings.add('item1', { type: 'item' });
    expect(schemaSettings.get('item1')).toEqual({ name: 'item1', type: 'item' });
    expect(schemaSettings.get('no-exist')).toEqual(undefined);
    expect(schemaSettings.get(undefined)).toEqual(undefined);
  });

  test('gets a nested item', () => {
    schemaSettings.add('parent', { type: 'itemGroup' });
    schemaSettings.add('parent.item1', { type: 'item' });
    expect(schemaSettings.get('parent.item1')).toEqual({
      name: 'item1',
      type: 'item',
    });
    expect(schemaSettings.get('parent.item1.not-exist')).toEqual(undefined);
    expect(schemaSettings.get('parent.not-exist')).toEqual(undefined);
    expect(schemaSettings.get('parent.not-exist.not-exist')).toEqual(undefined);
  });

  test('returns undefined for a non-existent item', () => {
    expect(schemaSettings.get('nonExistent')).toBeUndefined();
  });

  test('removes an item', () => {
    schemaSettings.add('item1', { type: 'item' });
    schemaSettings.remove('item1');
    expect(schemaSettings.items).toEqual([]);
  });

  test('removes a nested item', () => {
    schemaSettings.add('parent', { type: 'item' });
    schemaSettings.add('parent.item1', { type: 'item' });
    schemaSettings.remove('parent');
    expect(schemaSettings.get('parent')).toEqual(undefined);
    expect(schemaSettings.get('parent.item1')).toEqual(undefined);
  });

  test('removes a nested child item', () => {
    schemaSettings.add('parent', { type: 'item' });
    schemaSettings.add('parent.item1', { type: 'item' });
    schemaSettings.remove('parent.item1');
    expect(schemaSettings.get('parent')).toBeDefined();
    expect(schemaSettings.get('parent.item1')).toEqual(undefined);
  });

  test('does nothing when removing a non-existent item', () => {
    const initialItems = [...schemaSettings.items];
    schemaSettings.remove('nonExistent');
    expect(schemaSettings.items).toEqual(initialItems);
  });
});
