/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vi } from 'vitest';
import { FlowEngine } from '../../flowEngine';
import type { FlowModelOptions, IModelComponentProps } from '../../types';
import { FlowModel } from '../flowModel';
import { ForkFlowModel } from '../forkFlowModel';

// Helper functions
const createMockFlowEngine = (): FlowEngine => {
  return new FlowEngine();
};

const createMockFlowModel = (overrides: Partial<FlowModelOptions> = {}): FlowModel => {
  const flowEngine = createMockFlowEngine();
  const options = {
    uid: 'test-master-uid',
    flowEngine,
    props: { masterProp: 'masterValue' },
    stepParams: { testFlow: { step1: { param1: 'value1' } } },
    sortIndex: 0,
    subModels: {},
    async: false,
    ...overrides,
  };

  const model = new FlowModel(options);
  return model;
};

// Test setup
let mockMaster: FlowModel;
let initialProps: IModelComponentProps;

beforeEach(() => {
  mockMaster = createMockFlowModel();
  initialProps = { forkProp: 'forkValue' };
  vi.clearAllMocks();
});

describe('ForkFlowModel', () => {
  // ==================== CONSTRUCTOR & INITIALIZATION ====================
  describe('Constructor & Initialization', () => {
    test('should create fork with basic parameters', () => {
      const fork = new ForkFlowModel(mockMaster, initialProps, 1);

      expect(fork.uid).toBe(mockMaster.uid);
      expect(fork.forkId).toBe(1);
      expect(fork.localProps).toEqual(initialProps);
      expect(fork.isFork).toBe(true);
      expect((fork as any).master).toBe(mockMaster);
      expect((fork as any).disposed).toBe(false);
    });

    test('should create fork with default parameters', () => {
      const fork = new ForkFlowModel(mockMaster);

      expect(fork.uid).toBe(mockMaster.uid);
      expect(fork.forkId).toBe(0);
      expect(fork.localProps).toEqual({});
      expect(fork.isFork).toBe(true);
    });

    test('should return Proxy object', () => {
      const fork = new ForkFlowModel(mockMaster, initialProps);

      // Verify it's a Proxy by checking transparent property access
      expect(typeof fork).toBe('object');
      expect(fork.constructor).toBe(mockMaster.constructor);
    });
  });

  // ==================== PROXY GET MECHANISM ====================
  describe('Proxy Get Mechanism', () => {
    let fork: ForkFlowModel;

    beforeEach(() => {
      fork = new ForkFlowModel(mockMaster, initialProps, 1);
    });

    test('should return disposed status correctly', () => {
      expect(fork['disposed']).toBe(false);

      fork.dispose();

      expect(fork['disposed']).toBe(true);
    });

    test('should return master constructor for constructor property', () => {
      expect(fork.constructor).toBe(mockMaster.constructor);
      expect(fork.constructor).toBe(FlowModel);
    });

    test('should merge props from master and local', () => {
      const masterProps = { masterProp: 'masterValue', shared: 'master' };
      const localProps = { localProp: 'localValue', shared: 'local' };

      mockMaster.getProps = vi.fn(() => masterProps);
      fork.localProps = localProps;

      const mergedProps = fork.props;

      expect(mergedProps).toEqual({
        masterProp: 'masterValue',
        localProp: 'localValue',
        shared: 'local', // Local should override master
      });
    });

    test('should return fork own properties first', () => {
      expect(fork.uid).toBe(mockMaster.uid);
      expect(fork.forkId).toBe(1);
      expect(fork.isFork).toBe(true);
      expect(fork.localProps).toEqual(initialProps);
    });

    test('should access local properties storage', () => {
      // Set a local property directly
      (fork as any).localCustomProp = 'localValue';

      expect((fork as any).localCustomProp).toBe('localValue');
    });

    test('should fallback to master properties', () => {
      // Access master property that doesn\'t exist on fork
      const masterStepParams = mockMaster.stepParams;

      expect((fork as any).stepParams).toBe(masterStepParams);
    });

    test('should bind functions to fork instance', () => {
      const testMethod = vi.fn(function (this: any) {
        return this.uid;
      });

      (mockMaster as any).testMethod = testMethod;

      const result = (fork as any).testMethod();

      expect(testMethod).toHaveBeenCalled();
      expect(result).toBe(fork.uid);
    });

    test('should preserve master constructor in function context', () => {
      const testMethod = vi.fn(function (this: any) {
        return this.constructor;
      });

      (mockMaster as any).testMethod = testMethod;

      const result = (fork as any).testMethod();

      expect(result).toBe(mockMaster.constructor);
    });

    test('should pass arguments to bound functions', () => {
      const testMethod = vi.fn((arg1: string, arg2: number) => `${arg1}-${arg2}`);

      (mockMaster as any).testMethod = testMethod;

      const result = (fork as any).testMethod('test', 123);

      expect(testMethod).toHaveBeenCalledWith('test', 123);
      expect(result).toBe('test-123');
    });

    test('should handle non-function master properties', () => {
      (mockMaster as any).masterData = { key: 'value' };

      expect((fork as any).masterData).toEqual({ key: 'value' });
    });

    test('should handle undefined master properties', () => {
      expect((fork as any).nonExistentProperty).toBeUndefined();
    });

    test('should create correct context object for functions', () => {
      const contextChecker = vi.fn(function (this: any) {
        return {
          hasConstructor: 'constructor' in this,
          constructorValue: this.constructor,
          isConfigurable: Object.getOwnPropertyDescriptor(this, 'constructor')?.configurable,
          isEnumerable: Object.getOwnPropertyDescriptor(this, 'constructor')?.enumerable,
          isWritable: Object.getOwnPropertyDescriptor(this, 'constructor')?.writable,
        };
      });

      (mockMaster as any).contextChecker = contextChecker;

      const result = (fork as any).contextChecker();

      expect(result.hasConstructor).toBe(true);
      expect(result.constructorValue).toBe(mockMaster.constructor);
      expect(result.isConfigurable).toBe(true);
      expect(result.isEnumerable).toBe(false);
      expect(result.isWritable).toBe(false);
    });
  });

  // ==================== PROXY SET MECHANISM ====================
  describe('Proxy Set Mechanism', () => {
    let fork: ForkFlowModel;

    beforeEach(() => {
      fork = new ForkFlowModel(mockMaster, initialProps);
    });

    test('should ignore setting props property', () => {
      const originalProps = fork.props;

      (fork as any).props = { newProp: 'newValue' };

      // Props should remain unchanged since set returns true but doesn't actually set
      expect(fork.props).toEqual(originalProps);
    });

    test('should set fork own properties directly', () => {
      fork.localProps = { newLocal: 'value' };

      expect(fork.localProps).toEqual({ newLocal: 'value' });
    });

    test('should sync shared properties to master', () => {
      const newStepParams = { newFlow: { newStep: { param: 'value' } } };

      (fork as any).stepParams = newStepParams;

      expect((mockMaster as any).stepParams).toEqual(newStepParams);
    });

    test('should store non-shared properties locally', () => {
      const customValue = { data: 'localData' };

      (fork as any).customProperty = customValue;

      expect((fork as any).customProperty).toBe(customValue);
      expect((mockMaster as any).customProperty).toBeUndefined();
    });

    test('should call master setter for shared properties', () => {
      const setterSpy = vi.fn();

      // Mock a setter on master
      Object.defineProperty(mockMaster, 'sortIndex', {
        get: () => 0,
        set: setterSpy,
        configurable: true,
      });

      (fork as any).sortIndex = 5;

      expect(setterSpy).toHaveBeenCalledWith(5);
    });

    test('should handle shared property without setter', () => {
      // stepParams should be a shared property without custom setter
      const newParams = { flow: { step: { param: 'test' } } };

      (fork as any).stepParams = newParams;

      expect((mockMaster as any).stepParams).toEqual(newParams);
    });

    test('should identify shared properties correctly', () => {
      const originalSharedProps = ForkFlowModel.getSharedProperties();

      expect(originalSharedProps).toContain('stepParams');
      expect(originalSharedProps).toContain('sortIndex');
    });

    test('should handle property descriptor lookup', () => {
      // Create a property with descriptor on master
      Object.defineProperty(mockMaster, 'testDescriptor', {
        get: () => 'test',
        set: vi.fn(),
        configurable: true,
      });

      const fork = new ForkFlowModel(mockMaster, initialProps);

      // Access the property descriptor indirectly through shared property setting
      // ForkFlowModel.setSharedProperties(['testDescriptor']);

      (fork as any).testDescriptor = 'newValue';

      // Verify the setter was called (indirectly validates descriptor lookup)
      const descriptor = Object.getOwnPropertyDescriptor(mockMaster, 'testDescriptor');
      expect(descriptor?.set).not.toHaveBeenCalled();
    });

    test('should handle non-existent property descriptors', () => {
      ForkFlowModel.setSharedProperties(['nonExistentProp']);

      // Should not throw when setting property without descriptor
      expect(() => {
        (fork as any).nonExistentProp = 'value';
      }).not.toThrow();

      expect((mockMaster as any).nonExistentProp).toBe('value');
    });
  });

  // ==================== SHARED PROPERTIES MANAGEMENT ====================
  describe('Shared Properties Management', () => {
    test('should set shared properties configuration', () => {
      const newSharedProps = ['customProp1', 'customProp2'];

      ForkFlowModel.setSharedProperties(newSharedProps);

      expect(ForkFlowModel.getSharedProperties()).toEqual(newSharedProps);
    });

    test('should get current shared properties', () => {
      const currentProps = ForkFlowModel.getSharedProperties();

      expect(Array.isArray(currentProps)).toBe(true);
      expect(currentProps.length).toBeGreaterThan(0);
    });

    test('should have default shared properties', () => {
      // Reset to defaults
      ForkFlowModel.setSharedProperties(['stepParams', 'sortIndex']);

      const defaultProps = ForkFlowModel.getSharedProperties();

      expect(defaultProps).toContain('stepParams');
      expect(defaultProps).toContain('sortIndex');
    });

    test('should identify shared property correctly', () => {
      ForkFlowModel.setSharedProperties(['testProp']);
      const fork = new ForkFlowModel(mockMaster, initialProps);

      // Use private method indirectly through property setting behavior
      (fork as any).testProp = 'value';

      expect((mockMaster as any).testProp).toBe('value');
    });

    test('should identify non-shared property correctly', () => {
      ForkFlowModel.setSharedProperties(['onlyThisProp']);
      const fork = new ForkFlowModel(mockMaster, initialProps);

      (fork as any).nonSharedProp = 'value';

      expect((fork as any).nonSharedProp).toBe('value');
      expect((mockMaster as any).nonSharedProp).toBeUndefined();
    });
  });

  // ==================== PROPS MANAGEMENT ====================
  describe('Props Management', () => {
    let fork: ForkFlowModel;

    beforeEach(() => {
      fork = new ForkFlowModel(mockMaster, { initial: 'value' });
    });

    test('should set props with string key-value', () => {
      fork.setProps('newKey', 'newValue');

      expect(fork.localProps.newKey).toBe('newValue');
      expect(fork.localProps.initial).toBe('value'); // Should preserve existing
    });

    test('should set props with object', () => {
      const newProps = { prop1: 'value1', prop2: 'value2' };

      fork.setProps(newProps);

      expect(fork.localProps).toEqual({
        initial: 'value',
        prop1: 'value1',
        prop2: 'value2',
      });
    });

    test('should merge props correctly', () => {
      fork.setProps({ existing: 'updated', new: 'added' });

      expect(fork.localProps).toEqual({
        initial: 'value',
        existing: 'updated',
        new: 'added',
      });
    });

    test('should get merged props from master and local', () => {
      const masterProps = { master: 'value', shared: 'master' };
      const localProps = { local: 'value', shared: 'local' };

      mockMaster.getProps = vi.fn(() => masterProps);
      fork.localProps = localProps;

      const result = fork.getProps();

      expect(result).toEqual({
        master: 'value',
        local: 'value',
        shared: 'local', // Local should override
      });
    });

    test('should maintain local props independence', () => {
      const originalProps = { ...fork.localProps };

      fork.setProps('newKey', 'newValue');

      expect(fork.localProps.newKey).toBe('newValue');
      expect(originalProps).not.toHaveProperty('newKey');
    });

    test('should ignore setProps when disposed', () => {
      fork.dispose();
      const originalProps = { ...fork.localProps };

      fork.setProps('shouldIgnore', 'value');

      expect(fork.localProps).toEqual(originalProps);
    });

    test('should handle props priority in getter', () => {
      mockMaster.getProps = vi.fn(() => ({
        masterOnly: 'master',
        conflict: 'master',
      }));

      fork.localProps = {
        localOnly: 'local',
        conflict: 'local',
      };

      const merged = fork.props;

      expect(merged.masterOnly).toBe('master');
      expect(merged.localOnly).toBe('local');
      expect(merged.conflict).toBe('local'); // Local wins
    });

    test('should handle nested object props', () => {
      const nestedProps = {
        user: { name: 'John', settings: { theme: 'dark' } },
        config: { debug: true },
      };

      fork.setProps(nestedProps);

      expect(fork.localProps.user).toEqual(nestedProps.user);
      expect(fork.localProps.config).toEqual(nestedProps.config);
    });
  });

  // ==================== CONTEXT AND SHARED STATE ====================
  describe('Context and Shared State', () => {
    let fork: ForkFlowModel;

    beforeEach(() => {
      fork = new ForkFlowModel(mockMaster, initialProps);
    });

    test('should set shared context', () => {
      const contextData = { key1: 'value1', key2: 'value2' };

      fork.defineContextProperties(contextData);

      // Check that the context properties are defined
      expect(fork.context.key1).toEqual('value1');
      expect(fork.context.key2).toEqual('value2');
    });

    test('should merge shared context', () => {
      fork.defineContextProperties({ initial: 'value' });
      fork.defineContextProperties({ additional: 'data', initial: 'updated' });

      // Check that context properties are merged correctly
      expect(fork.context.initial).toEqual('updated');
      expect(fork.context.additional).toEqual('data');
    });

    test('should get ctx with globals and shared', () => {
      const sharedContext = { shared: 'data' };

      // Define context properties on the fork
      fork.defineContextProperties(sharedContext);

      const ctx = fork.context;

      // Check that shared properties are accessible through ctx
      expect(ctx.shared).toEqual('data');

      // Verify that fork has its own context instance
      expect(ctx).toBeDefined();
      expect(ctx).toBeInstanceOf(Object);
    });
  });

  // ==================== RENDER MECHANISM ====================
  describe('Render Mechanism', () => {
    let fork: ForkFlowModel;

    beforeEach(() => {
      fork = new ForkFlowModel(mockMaster, { localStyle: 'local' });
    });

    test('should render with merged props', () => {
      const masterProps = { masterStyle: 'master', shared: 'master' };
      const expectedMerged = {
        masterStyle: 'master',
        localStyle: 'local',
        shared: 'local',
      };

      mockMaster.getProps = vi.fn(() => masterProps);
      fork.localProps = { localStyle: 'local', shared: 'local' };

      mockMaster.render = vi.fn(function (this: any) {
        return { type: 'div', props: this.props };
      });

      const result = fork.render();

      expect(mockMaster.render).toHaveBeenCalled();
      expect(result.props).toEqual(expectedMerged);
    });

    test('should call master render with fork as this', () => {
      let renderThis: any;

      mockMaster.render = vi.fn(function (this: any) {
        renderThis = this;
        return { type: 'span', props: this.props };
      });

      fork.render();

      expect(renderThis).toBe(fork);
      expect(renderThis.isFork).toBe(true);
    });

    // TODO: This test case indicates a bug? even it is passing... we should not restore!
    // test('should restore original props after render', () => {
    //   const originalProps = fork.props;

    //   mockMaster.render = vi.fn(function(this: any) {
    //     // Modify props during render
    //     this.props = { modified: 'during-render' };
    //     return { type: 'div', props: this.props };
    //   });

    //   fork.render();

    //   // Props should be restored
    //   expect(fork.props).toEqual(originalProps);
    // });

    test('should return null when disposed', () => {
      mockMaster.render = vi.fn();
      fork.dispose();

      const result = fork.render();

      expect(result).toBeNull();
      expect(mockMaster.render).not.toHaveBeenCalled();
    });

    test('should handle render exceptions gracefully', () => {
      mockMaster.render = vi.fn(() => {
        throw new Error('Render error');
      });

      expect(() => fork.render()).toThrow('Render error');
    });
  });

  // ==================== LIFECYCLE MANAGEMENT ====================
  describe('Lifecycle Management', () => {
    let fork: ForkFlowModel;

    beforeEach(() => {
      mockMaster = createMockFlowModel();
      (mockMaster as any).forks = new Set();
      (mockMaster as any).forkCache = new Map();

      fork = new ForkFlowModel(mockMaster, initialProps);
      (mockMaster as any).forks.add(fork);
    });

    test('should dispose and change status', () => {
      expect(fork['disposed']).toBe(false);

      fork.dispose();

      expect(fork['disposed']).toBe(true);
    });

    test('should remove from master forks collection', () => {
      expect((mockMaster as any).forks.has(fork)).toBe(true);

      fork.dispose();

      expect((mockMaster as any).forks.has(fork)).toBe(false);
    });

    test('should remove from master fork cache', () => {
      const cacheKey = 'testKey';
      (mockMaster as any).forkCache.set(cacheKey, fork);

      fork.dispose();

      expect((mockMaster as any).forkCache.has(cacheKey)).toBe(false);
    });

    test('should clear master reference', () => {
      fork.dispose();

      expect((fork as any).master).toBeNull();
    });

    test('should handle dispose when already disposed', () => {
      fork.dispose();

      // Should not throw on second dispose
      expect(() => fork.dispose()).not.toThrow();
      expect(fork['disposed']).toBe(true);
    });

    test('should find and remove correct fork from cache', () => {
      const fork1 = new ForkFlowModel(mockMaster, {}, 1);
      const fork2 = new ForkFlowModel(mockMaster, {}, 2);

      (mockMaster as any).forkCache.set('key1', fork1);
      (mockMaster as any).forkCache.set('key2', fork2);

      fork1.dispose();

      expect((mockMaster as any).forkCache.has('key1')).toBe(false);
      expect((mockMaster as any).forkCache.has('key2')).toBe(true);
    });
  });

  // ==================== FUNCTION BINDING AND CONTEXT ====================
  describe('Function Binding and Context', () => {
    let fork: ForkFlowModel;

    beforeEach(() => {
      fork = new ForkFlowModel(mockMaster, initialProps);
    });

    test('should bind master methods to fork instance', () => {
      const boundMethod = vi.fn(function (this: any) {
        return {
          uid: this.uid,
          isFork: this.isFork,
          forkId: this.forkId,
        };
      });

      (mockMaster as any).boundMethod = boundMethod;

      const result = (fork as any).boundMethod();

      expect(result.uid).toBe(fork.uid);
      expect(result.isFork).toBe(true);
      expect(result.forkId).toBe(fork.forkId);
    });

    test('should preserve constructor in bound method context', () => {
      const constructorChecker = vi.fn(function (this: any) {
        return this.constructor === mockMaster.constructor;
      });

      (mockMaster as any).constructorChecker = constructorChecker;

      const result = (fork as any).constructorChecker();

      expect(result).toBe(true);
    });

    test('should handle async methods correctly', async () => {
      const asyncMethod = vi.fn(async function (this: any) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              uid: this.uid,
              constructor: this.constructor,
            });
          }, 0);
        });
      });

      (mockMaster as any).asyncMethod = asyncMethod;

      const result = await (fork as any).asyncMethod();

      expect(result.uid).toBe(fork.uid);
      expect(result.constructor).toBe(mockMaster.constructor);
    });

    test('should pass method arguments correctly', () => {
      const methodWithArgs = vi.fn(function (arg1: string, arg2: number, arg3: object) {
        return { arg1, arg2, arg3 };
      });

      (mockMaster as any).methodWithArgs = methodWithArgs;

      const testObj = { test: 'object' };
      const result = (fork as any).methodWithArgs('test', 123, testObj);

      expect(methodWithArgs).toHaveBeenCalledWith('test', 123, testObj);
      expect(result).toEqual({ arg1: 'test', arg2: 123, arg3: testObj });
    });

    test('should handle method return values correctly', () => {
      const methodWithReturn = vi.fn(() => ({ success: true, data: 'result' }));

      (mockMaster as any).methodWithReturn = methodWithReturn;

      const result = (fork as any).methodWithReturn();

      expect(result).toEqual({ success: true, data: 'result' });
    });

    test('should create correct context object properties', () => {
      const contextInspector = vi.fn(function (this: any) {
        const descriptor = Object.getOwnPropertyDescriptor(this, 'constructor');
        return {
          hasOwnConstructor: Object.prototype.hasOwnProperty.call(this, 'constructor'),
          constructorValue: this.constructor,
          descriptorExists: !!descriptor,
          configurable: descriptor?.configurable,
          enumerable: descriptor?.enumerable,
          writable: descriptor?.writable,
        };
      });

      (mockMaster as any).contextInspector = contextInspector;

      const result = (fork as any).contextInspector();

      expect(result.hasOwnConstructor).toBe(true);
      expect(result.constructorValue).toBe(mockMaster.constructor);
      expect(result.descriptorExists).toBe(true);
      expect(result.configurable).toBe(true);
      expect(result.enumerable).toBe(false);
      expect(result.writable).toBe(false);
    });

    test('should handle closure constructor capture', () => {
      // Create a method that captures constructor in closure
      let capturedConstructor: any;

      const closureMethod = function (this: any) {
        capturedConstructor = this.constructor;
        return this.constructor;
      };

      (mockMaster as any).closureMethod = closureMethod;

      const result = (fork as any).closureMethod();

      expect(capturedConstructor).toBe(mockMaster.constructor);
      expect(result).toBe(mockMaster.constructor);
    });

    test('should maintain correct this binding in nested calls', () => {
      const nestedMethod = vi.fn(function (this: any) {
        return this.uid;
      });

      const callerMethod = vi.fn(function (this: any) {
        return {
          directUid: this.uid,
          nestedUid: nestedMethod.call(this),
        };
      });

      (mockMaster as any).nestedMethod = nestedMethod;
      (mockMaster as any).callerMethod = callerMethod;

      const result = (fork as any).callerMethod();

      expect(result.directUid).toBe(fork.uid);
      expect(result.nestedUid).toBe(fork.uid);
    });
  });

  // ==================== EDGE CASES AND ERROR HANDLING ====================
  describe('Edge Cases and Error Handling', () => {
    let fork: ForkFlowModel;

    beforeEach(() => {
      fork = new ForkFlowModel(mockMaster, initialProps);
    });

    test('should handle accessing non-existent properties', () => {
      const value = (fork as any).totallyNonExistentProperty;

      expect(value).toBeUndefined();
    });

    test('should handle setting props property directly', () => {
      const originalProps = fork.props;

      // This should be ignored by the proxy
      (fork as any).props = { ignored: 'value' };

      // Props should be accessed through the getter mechanism
      expect(fork.props).toEqual(originalProps);
    });

    test('should handle master being null during property access', () => {
      // Force master to null (simulating a disposed state)
      (fork as any).master = null;

      expect(() => {
        void (fork as any).someProperty;
      }).toThrow('Cannot read properties of null');
    });

    test('should handle setProps with null/undefined values', () => {
      fork.setProps('nullProp', null);
      fork.setProps('undefinedProp', undefined);

      expect(fork.localProps.nullProp).toBeNull();
      expect(fork.localProps.undefinedProp).toBeUndefined();
    });

    test('should handle complex nested property access patterns', () => {
      // Set up complex nested structure
      (mockMaster as any).nested = {
        deep: {
          property: {
            value: 'deep value',
          },
        },
      };

      expect((fork as any).nested.deep.property.value).toBe('deep value');
    });
  });
});
