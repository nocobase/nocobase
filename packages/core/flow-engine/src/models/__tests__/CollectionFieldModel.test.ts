/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { CollectionFieldModel } from '../CollectionFieldModel';

describe('CollectionFieldModel', () => {
  let mockContext: any;
  let mockCollectionField: any;

  beforeEach(() => {
    // Mock context and collectionField
    mockContext = {
      engine: {
        getModelClass: (modelName: string) => modelName === 'ValidModel', // Only 'ValidModel' is valid
      },
    };

    mockCollectionField = {
      interface: 'TestInterface',
      target: 'test',
    };

    // Clear bindings before each test
    CollectionFieldModel.bindings.clear();
  });

  it('should bind a model to an interface', () => {
    CollectionFieldModel.bindModelToInterface('TestModel', 'TestInterface', {
      isDefault: true,
      when: (ctx, field) => field.target === 'test',
    });

    const bindings = CollectionFieldModel.bindings.get('TestInterface');
    expect(bindings).toHaveLength(1);
    expect(bindings[0]).toMatchObject({
      modelName: 'TestModel',
      isDefault: true,
    });
  });

  it('should get bindings by field', () => {
    CollectionFieldModel.bindModelToInterface('ValidModel', 'TestInterface', {
      when: (ctx, field) => field.target === 'test',
    });
    CollectionFieldModel.bindModelToInterface('InvalidModel', 'TestInterface', {
      when: (ctx, field) => field.target === 'invalid',
    });

    const bindings = CollectionFieldModel.getBindingsByField(mockContext, mockCollectionField);
    expect(bindings).toHaveLength(1);
    expect(bindings[0].modelName).toBe('ValidModel');
  });

  it('should get default binding by field', () => {
    CollectionFieldModel.bindModelToInterface('ValidModel', 'TestInterface', {
      isDefault: true,
      when: (ctx, field) => field.target === 'test',
    });
    CollectionFieldModel.bindModelToInterface('AnotherModel', 'TestInterface', {
      when: (ctx, field) => field.target === 'test',
    });

    const defaultBinding = CollectionFieldModel.getDefaultBindingByField(mockContext, mockCollectionField);
    expect(defaultBinding).toBeTruthy();
    expect(defaultBinding.modelName).toBe('ValidModel');
  });

  it('should get default binding by field', () => {
    CollectionFieldModel.bindModelToInterface('ValidModel', 'TestInterface', {
      when: (ctx, field) => field.target === 'test',
    });
    CollectionFieldModel.bindModelToInterface('AnotherModel', 'TestInterface', {
      when: (ctx, field) => field.target === 'test',
    });

    const defaultBinding = CollectionFieldModel.getDefaultBindingByField(mockContext, mockCollectionField);
    expect(defaultBinding).toBeTruthy();
    expect(defaultBinding.modelName).toBe('ValidModel');
  });

  it('should return null if no default binding is found', () => {
    CollectionFieldModel.bindModelToInterface('AnotherModel', 'TestInterface', {
      when: (ctx, field) => field.target === 'test',
    });

    const defaultBinding = CollectionFieldModel.getDefaultBindingByField(mockContext, mockCollectionField);
    expect(defaultBinding).toBeFalsy();
  });

  it('should return an empty array if no bindings are found', () => {
    const bindings = CollectionFieldModel.getBindingsByField(mockContext, mockCollectionField);
    expect(bindings).toHaveLength(0);
  });

  it('should return null if no bindings exist for the interface', () => {
    const defaultBinding = CollectionFieldModel.getDefaultBindingByField(mockContext, mockCollectionField);
    expect(defaultBinding).toBeNull();
  });
});
