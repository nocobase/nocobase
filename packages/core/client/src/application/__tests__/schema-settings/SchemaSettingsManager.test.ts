/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaSettings, Application } from '@nocobase/client';

describe('SchemaSettingsManager', () => {
  let app: Application;

  beforeEach(() => {
    app = new Application();
  });

  it('should add schema initializers correctly', () => {
    const demo = new SchemaSettings({ name: 'test', items: [] });
    app.schemaSettingsManager.add(demo);

    expect(app.schemaSettingsManager.has('test')).toBeTruthy();
  });

  it('should handle addition of items to non-existent schema initializers', () => {
    app.schemaSettingsManager.addItem('test', 'item1', { type: 'item' });
    expect(app.schemaSettingsManager.has('test')).toBeFalsy();

    const demo = new SchemaSettings({ name: 'test', items: [] });
    app.schemaSettingsManager.add(demo);
    expect(app.schemaSettingsManager.has('test')).toBeTruthy();
    const demoRes = app.schemaSettingsManager.get('test');
    expect(demoRes.get('item1')).toBeDefined();
  });

  it('should add item to existing schema settings', () => {
    const mockInitializer = new SchemaSettings({ name: 'test', items: [] });
    const fn = vitest.spyOn(mockInitializer, 'add');
    app.schemaSettingsManager.add(mockInitializer);

    app.schemaSettingsManager.addItem('test', 'item1', { type: 'item' });
    expect(fn).toHaveBeenCalledWith('item1', { type: 'item' });
  });

  it('should return a specific schema settings when it exists', () => {
    const mockInitializer = new SchemaSettings({ name: 'test', items: [] });
    app.schemaSettingsManager.add(mockInitializer);

    const fetchedInitializer = app.schemaSettingsManager.get('test');
    expect(fetchedInitializer).toBe(mockInitializer);
  });

  it('should return undefined when schema settings does not exist', () => {
    const fetchedInitializer = app.schemaSettingsManager.get('nonExistent');
    expect(fetchedInitializer).toBeUndefined();
  });

  it('should return all schema initializers', () => {
    const mockInitializer1 = new SchemaSettings({ name: 'test1', items: [] });
    const mockInitializer2 = new SchemaSettings({ name: 'test2', items: [] });
    app.schemaSettingsManager.add(mockInitializer1, mockInitializer2);

    const initializers = app.schemaSettingsManager.getAll();
    expect(initializers).toEqual({
      test1: mockInitializer1,
      test2: mockInitializer2,
    });
  });

  it('should correctly check if schema settings exists', () => {
    const mockInitializer = new SchemaSettings({ name: 'test', items: [] });
    app.schemaSettingsManager.add(mockInitializer);

    expect(app.schemaSettingsManager.has('test')).toBeTruthy();
    expect(app.schemaSettingsManager.has('nonExistent')).toBeFalsy();
  });

  it('should remove schema settings', () => {
    const mockInitializer = new SchemaSettings({ name: 'test', items: [] });
    app.schemaSettingsManager.add(mockInitializer);

    app.schemaSettingsManager.remove('test');
    expect(app.schemaSettingsManager.has('test')).toBeFalsy();
  });

  it('should handle removal of items for non-existent schema initializers', () => {
    expect(() => app.schemaSettingsManager.removeItem('nonExistent', 'item1')).not.toThrowError();
  });

  it('should remove item from existing schema settings', () => {
    const mockInitializer = new SchemaSettings({ name: 'test', items: [] });
    const fn = vitest.spyOn(mockInitializer, 'remove');
    app.schemaSettingsManager.add(mockInitializer);
    app.schemaSettingsManager.removeItem('test', 'item1');
    expect(fn).toHaveBeenCalledWith('item1');
  });
});
