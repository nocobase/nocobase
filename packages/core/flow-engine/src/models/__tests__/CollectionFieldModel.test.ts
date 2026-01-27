/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldModel } from '@nocobase/flow-engine';
import { beforeEach, describe, expect, it } from 'vitest';

describe('CollectionFieldModel', () => {
  let mockContext: any;
  let mockCollectionField: any;

  let TestModel: typeof CollectionFieldModel;

  beforeEach(() => {
    // @ts-ignore
    TestModel = class extends CollectionFieldModel {};
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
    TestModel.bindings.clear();
  });

  it('should bind a model to an interface', () => {
    TestModel.bindModelToInterface('TestModel', 'TestInterface', {
      isDefault: true,
      when: (ctx, field) => field.target === 'test',
    });

    const bindings = TestModel.bindings.get('TestInterface');
    expect(bindings).toHaveLength(1);
    expect(bindings[0]).toMatchObject({
      modelName: 'TestModel',
      isDefault: true,
    });
  });

  it('should get bindings by field', () => {
    TestModel.bindModelToInterface('ValidModel', 'TestInterface', {
      when: (ctx, field) => field.target === 'test',
    });
    TestModel.bindModelToInterface('InvalidModel', 'TestInterface', {
      when: (ctx, field) => field.target === 'invalid',
    });

    const bindings = TestModel.getBindingsByField(mockContext, mockCollectionField);
    expect(bindings).toHaveLength(1);
    expect(bindings[0].modelName).toBe('ValidModel');
  });

  it('should get default binding by field', () => {
    TestModel.bindModelToInterface('ValidModel', 'TestInterface', {
      isDefault: true,
      when: (ctx, field) => field.target === 'test',
    });
    TestModel.bindModelToInterface('AnotherModel', 'TestInterface', {
      when: (ctx, field) => field.target === 'test',
    });

    const defaultBinding = TestModel.getDefaultBindingByField(mockContext, mockCollectionField);
    expect(defaultBinding).toBeTruthy();
    expect(defaultBinding.modelName).toBe('ValidModel');
  });

  it('should get default binding by field', () => {
    TestModel.bindModelToInterface('ValidModel', 'TestInterface', {
      when: (ctx, field) => field.target === 'test',
    });
    TestModel.bindModelToInterface('AnotherModel', 'TestInterface', {
      when: (ctx, field) => field.target === 'test',
    });

    const defaultBinding = TestModel.getDefaultBindingByField(mockContext, mockCollectionField);
    expect(defaultBinding).toBeTruthy();
    expect(defaultBinding.modelName).toBe('ValidModel');
  });

  it('should return null if no default binding is found', () => {
    TestModel.bindModelToInterface('AnotherModel', 'TestInterface', {
      when: (ctx, field) => field.target === 'test',
    });

    const defaultBinding = TestModel.getDefaultBindingByField(mockContext, mockCollectionField);
    expect(defaultBinding).toBeFalsy();
  });

  it('should return an empty array if no bindings are found', () => {
    const bindings = TestModel.getBindingsByField(mockContext, mockCollectionField);
    expect(bindings).toHaveLength(0);
  });

  it('should return null if no bindings exist for the interface', () => {
    const defaultBinding = TestModel.getDefaultBindingByField(mockContext, mockCollectionField);
    expect(defaultBinding).toBeNull();
  });

  it('should return null if no bindings exist for the interface', () => {
    class Test1Model extends CollectionFieldModel {}
    class Test2Model extends Test1Model {}
    class Test3Model extends Test1Model {}
    Test1Model.bindModelToInterface('TestModel1', 'TestInterface');
    Test2Model.bindModelToInterface('TestModel2', 'TestInterface');
    Test3Model.bindModelToInterface('TestModel3', 'TestInterface');
    expect(Test1Model.bindings.get('TestInterface')).toHaveLength(1);
    expect(Test2Model.bindings.get('TestInterface')).toHaveLength(2);
    expect(Test3Model.bindings.get('TestInterface')).toHaveLength(2);
  });
});
