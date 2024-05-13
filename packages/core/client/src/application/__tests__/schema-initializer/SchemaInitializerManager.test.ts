/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaInitializer, Application } from '@nocobase/client';

describe('SchemaInitializerManager', () => {
  let app: Application;

  beforeEach(() => {
    app = new Application();
  });

  it('should add schema initializers correctly', () => {
    const demo = new SchemaInitializer({ name: 'test' });
    app.schemaInitializerManager.add(demo);

    expect(app.schemaInitializerManager.has('test')).toBeTruthy();
  });

  it('should handle addition of items to non-existent schema initializers', () => {
    app.schemaInitializerManager.addItem('test', 'item1', {});
    expect(app.schemaInitializerManager.has('test')).toBeFalsy();

    const demo = new SchemaInitializer({ name: 'test' });
    app.schemaInitializerManager.add(demo);
    expect(app.schemaInitializerManager.has('test')).toBeTruthy();
    const demoRes = app.schemaInitializerManager.get('test');
    expect(demoRes.get('item1')).toBeDefined();
  });

  it('should add item to existing schema initializer', () => {
    const mockInitializer = new SchemaInitializer({ name: 'test' });
    const fn = vitest.spyOn(mockInitializer, 'add');
    app.schemaInitializerManager.add(mockInitializer);

    app.schemaInitializerManager.addItem('test', 'item1', {});
    expect(fn).toHaveBeenCalledWith('item1', {});
  });

  it('should return a specific schema initializer when it exists', () => {
    const mockInitializer = new SchemaInitializer({ name: 'test' });
    app.schemaInitializerManager.add(mockInitializer);

    const fetchedInitializer = app.schemaInitializerManager.get('test');
    expect(fetchedInitializer).toBe(mockInitializer);
  });

  it('should return undefined when schema initializer does not exist', () => {
    const fetchedInitializer = app.schemaInitializerManager.get('nonExistent');
    expect(fetchedInitializer).toBeUndefined();
  });

  it('should return all schema initializers', () => {
    const mockInitializer1 = new SchemaInitializer({ name: 'test1' });
    const mockInitializer2 = new SchemaInitializer({ name: 'test2' });
    app.schemaInitializerManager.add(mockInitializer1, mockInitializer2);

    const initializers = app.schemaInitializerManager.getAll();
    expect(initializers).toEqual({
      test1: mockInitializer1,
      test2: mockInitializer2,
    });
  });

  it('should correctly check if schema initializer exists', () => {
    const mockInitializer = new SchemaInitializer({ name: 'test' });
    app.schemaInitializerManager.add(mockInitializer);

    expect(app.schemaInitializerManager.has('test')).toBeTruthy();
    expect(app.schemaInitializerManager.has('nonExistent')).toBeFalsy();
  });

  it('should remove schema initializer', () => {
    const mockInitializer = new SchemaInitializer({ name: 'test' });
    app.schemaInitializerManager.add(mockInitializer);

    app.schemaInitializerManager.remove('test');
    expect(app.schemaInitializerManager.has('test')).toBeFalsy();
  });

  it('should handle removal of items for non-existent schema initializers', () => {
    expect(() => app.schemaInitializerManager.removeItem('nonExistent', 'item1')).not.toThrowError();
  });

  it('should remove item from existing schema initializer', () => {
    const mockInitializer = new SchemaInitializer({ name: 'test' });
    const fn = vitest.spyOn(mockInitializer, 'remove');
    app.schemaInitializerManager.add(mockInitializer);
    app.schemaInitializerManager.removeItem('test', 'item1');
    expect(fn).toHaveBeenCalledWith('item1');
  });
});
