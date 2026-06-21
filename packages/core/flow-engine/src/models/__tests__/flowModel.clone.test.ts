/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FlowEngine } from '../../flowEngine';
import { FlowModel } from '../flowModel';

describe('FlowModel.clone', () => {
  let flowEngine: FlowEngine;

  beforeEach(() => {
    flowEngine = new FlowEngine();
    // Mock api for FlowEngineContext
    (flowEngine.context as any).api = {
      auth: {
        role: 'admin',
        locale: 'en-US',
        token: 'mock-token',
      },
    };
    vi.clearAllMocks();
  });

  it('should clone a simple model with a new uid', () => {
    const original = flowEngine.createModel({
      uid: 'original-uid',
      use: 'FlowModel',
      props: { title: 'Original Title' },
      stepParams: { testFlow: { step1: { value: 'test' } } },
    });

    const cloned = original.clone();

    // uid should be different
    expect(cloned.uid).not.toBe(original.uid);

    // props should be the same
    expect(cloned.props).toEqual(original.props);

    // stepParams should be the same
    expect(cloned.stepParams).toEqual(original.stepParams);

    // should be registered in flowEngine
    expect(flowEngine.getModel(cloned.uid)).toBe(cloned);
  });

  it('should clone model without parent relationship', () => {
    const parent = flowEngine.createModel({
      uid: 'parent-uid',
      use: 'FlowModel',
    });

    const child = parent.addSubModel('children', {
      use: 'FlowModel',
      props: { name: 'child' },
    });

    const cloned = child.clone();

    // cloned model should not have parent
    expect(cloned.parent).toBeUndefined();
    expect(cloned['_options'].parentId).toBeUndefined();
  });

  it('should clone model with subModels recursively', () => {
    const parent = flowEngine.createModel({
      uid: 'parent-uid',
      use: 'FlowModel',
      props: { name: 'parent' },
    });

    const child1 = parent.addSubModel('items', {
      use: 'FlowModel',
      props: { name: 'child1' },
    });

    const child2 = parent.addSubModel('items', {
      use: 'FlowModel',
      props: { name: 'child2' },
    });

    const cloned = parent.clone();

    // parent uid should be different
    expect(cloned.uid).not.toBe(parent.uid);

    // subModels should exist
    expect(cloned.subModels['items']).toBeDefined();
    expect(cloned.subModels['items']).toHaveLength(2);

    // subModels uids should be different
    const clonedChildren = cloned.subModels['items'] as FlowModel[];
    expect(clonedChildren[0].uid).not.toBe(child1.uid);
    expect(clonedChildren[1].uid).not.toBe(child2.uid);

    // subModels props should be the same
    expect(clonedChildren[0].props.name).toBe('child1');
    expect(clonedChildren[1].props.name).toBe('child2');
  });

  it('should clone model with nested subModels', () => {
    const root = flowEngine.createModel({
      uid: 'root-uid',
      use: 'FlowModel',
      props: { level: 'root' },
    });

    const level1 = root.addSubModel('children', {
      use: 'FlowModel',
      props: { level: 'level1' },
    });

    const level2 = level1.addSubModel('children', {
      use: 'FlowModel',
      props: { level: 'level2' },
    });

    const cloned = root.clone();

    // All uids should be different
    expect(cloned.uid).not.toBe(root.uid);

    const clonedLevel1 = (cloned.subModels['children'] as FlowModel[])[0];
    expect(clonedLevel1.uid).not.toBe(level1.uid);
    expect(clonedLevel1.props.level).toBe('level1');

    const clonedLevel2 = (clonedLevel1.subModels['children'] as FlowModel[])[0];
    expect(clonedLevel2.uid).not.toBe(level2.uid);
    expect(clonedLevel2.props.level).toBe('level2');
  });

  it('should clone model with object-type subModel', () => {
    const parent = flowEngine.createModel({
      uid: 'parent-uid',
      use: 'FlowModel',
    });

    const header = parent.setSubModel('header', {
      use: 'FlowModel',
      props: { title: 'Header' },
    });

    const cloned = parent.clone();

    // parent uid should be different
    expect(cloned.uid).not.toBe(parent.uid);

    // object-type subModel should exist with different uid
    const clonedHeader = cloned.subModels['header'] as FlowModel;
    expect(clonedHeader).toBeDefined();
    expect(clonedHeader.uid).not.toBe(header.uid);
    expect(clonedHeader.props.title).toBe('Header');
  });

  it('should preserve sortIndex when cloning', () => {
    const model = flowEngine.createModel({
      uid: 'test-uid',
      use: 'FlowModel',
      sortIndex: 5,
    });

    const cloned = model.clone();

    expect(cloned.sortIndex).toBe(5);
  });

  it('should preserve stepParams when cloning', () => {
    const model = flowEngine.createModel({
      uid: 'test-uid',
      use: 'FlowModel',
      stepParams: {
        flow1: { step1: { param1: 'value1' } },
        flow2: { step2: { param2: 'value2' } },
      },
    });

    const cloned = model.clone();

    expect(cloned.stepParams).toEqual({
      flow1: { step1: { param1: 'value1' } },
      flow2: { step2: { param2: 'value2' } },
    });
  });

  it('should throw error if flowEngine is not set', () => {
    const model = flowEngine.createModel({
      uid: 'test-uid',
      use: 'FlowModel',
    });

    // Manually remove flowEngine to simulate edge case
    (model as any).flowEngine = null;

    expect(() => model.clone()).toThrow('FlowEngine is not set on this model. Please set flowEngine before cloning.');
  });

  it('should clone model with correct type', () => {
    class CustomModel extends FlowModel {
      customMethod() {
        return 'custom';
      }
    }

    flowEngine.registerModels({ CustomModel });

    const original = flowEngine.createModel<CustomModel>({
      uid: 'custom-uid',
      use: 'CustomModel',
      props: { custom: true },
    });

    const cloned = original.clone<CustomModel>();

    expect(cloned).toBeInstanceOf(CustomModel);
    expect(cloned.customMethod()).toBe('custom');
    expect(cloned.uid).not.toBe(original.uid);
  });

  it('should clone model and all cloned models should be independent', () => {
    const original = flowEngine.createModel({
      uid: 'original-uid',
      use: 'FlowModel',
      props: { value: 1 },
    });

    const cloned = original.clone();

    // Modify original
    original.setProps({ value: 2 });

    // Cloned should not be affected
    expect(cloned.props.value).toBe(1);
    expect(original.props.value).toBe(2);
  });

  it('should clone model with mixed subModels (array and object)', () => {
    const parent = flowEngine.createModel({
      uid: 'parent-uid',
      use: 'FlowModel',
    });

    // Add array-type subModels
    parent.addSubModel('items', { use: 'FlowModel', props: { type: 'item1' } });
    parent.addSubModel('items', { use: 'FlowModel', props: { type: 'item2' } });

    // Add object-type subModel
    parent.setSubModel('header', { use: 'FlowModel', props: { type: 'header' } });
    parent.setSubModel('footer', { use: 'FlowModel', props: { type: 'footer' } });

    const cloned = parent.clone();

    // Check array-type subModels
    const clonedItems = cloned.subModels['items'] as FlowModel[];
    expect(clonedItems).toHaveLength(2);
    expect(clonedItems[0].props.type).toBe('item1');
    expect(clonedItems[1].props.type).toBe('item2');

    // Check object-type subModels
    const clonedHeader = cloned.subModels['header'] as FlowModel;
    const clonedFooter = cloned.subModels['footer'] as FlowModel;
    expect(clonedHeader.props.type).toBe('header');
    expect(clonedFooter.props.type).toBe('footer');

    // All uids should be unique
    const originalItems = parent.subModels['items'] as FlowModel[];
    expect(clonedItems[0].uid).not.toBe(originalItems[0].uid);
    expect(clonedItems[1].uid).not.toBe(originalItems[1].uid);
    expect(clonedHeader.uid).not.toBe((parent.subModels['header'] as FlowModel).uid);
    expect(clonedFooter.uid).not.toBe((parent.subModels['footer'] as FlowModel).uid);
  });

  it('should correctly remap parentId for subModels to new parent uid', () => {
    const parent = flowEngine.createModel({
      uid: 'parent-uid',
      use: 'FlowModel',
    });

    const child = parent.addSubModel('children', {
      use: 'FlowModel',
      props: { name: 'child' },
    });

    // Verify original relationship
    expect(child.parentId).toBe(parent.uid);

    const cloned = parent.clone();
    const clonedChild = (cloned.subModels['children'] as FlowModel[])[0];

    // Root model should not have parentId
    expect(cloned.parentId).toBeUndefined();

    // Child's parentId should be remapped to cloned parent's uid
    expect(clonedChild.parentId).toBe(cloned.uid);
    expect(clonedChild.parentId).not.toBe(parent.uid);
  });

  it('should correctly remap parentId in deeply nested subModels', () => {
    const root = flowEngine.createModel({
      uid: 'root-uid',
      use: 'FlowModel',
    });

    const level1 = root.addSubModel('children', {
      use: 'FlowModel',
    });

    const level2 = level1.addSubModel('children', {
      use: 'FlowModel',
    });

    const cloned = root.clone();
    const clonedLevel1 = (cloned.subModels['children'] as FlowModel[])[0];
    const clonedLevel2 = (clonedLevel1.subModels['children'] as FlowModel[])[0];

    // Root should not have parentId
    expect(cloned.parentId).toBeUndefined();

    // Level1's parentId should point to cloned root
    expect(clonedLevel1.parentId).toBe(cloned.uid);

    // Level2's parentId should point to cloned level1
    expect(clonedLevel2.parentId).toBe(clonedLevel1.uid);
  });

  it('should replace uid references in props and other fields', () => {
    const parent = flowEngine.createModel({
      uid: 'parent-uid',
      use: 'FlowModel',
    });

    const child = parent.addSubModel('children', {
      use: 'FlowModel',
      props: {
        // Store a reference to parent uid in props
        targetUid: 'parent-uid',
        relatedIds: ['parent-uid'],
        nested: { refId: 'parent-uid' },
      },
    });

    const cloned = parent.clone();
    const clonedChild = (cloned.subModels['children'] as FlowModel[])[0];

    // Props containing old uid references should be updated to new uids
    expect(clonedChild.props.targetUid).toBe(cloned.uid);
    expect(clonedChild.props.relatedIds[0]).toBe(cloned.uid);
    expect(clonedChild.props.nested.refId).toBe(cloned.uid);
  });

  it('should replace uid references in stepParams', () => {
    const parent = flowEngine.createModel({
      uid: 'parent-uid',
      use: 'FlowModel',
    });

    const child = parent.addSubModel('children', {
      use: 'FlowModel',
      stepParams: {
        someFlow: {
          someStep: {
            targetModelUid: 'parent-uid',
          },
        },
      },
    });

    const cloned = parent.clone();
    const clonedChild = (cloned.subModels['children'] as FlowModel[])[0];

    // stepParams containing old uid references should be updated
    expect(clonedChild.stepParams.someFlow.someStep.targetModelUid).toBe(cloned.uid);
  });

  it('should handle self-referencing uid in props', () => {
    const model = flowEngine.createModel({
      uid: 'self-uid',
      use: 'FlowModel',
      props: {
        selfRef: 'self-uid',
      },
    });

    const cloned = model.clone();

    // Self-reference should be updated to new uid
    expect(cloned.props.selfRef).toBe(cloned.uid);
    expect(cloned.props.selfRef).not.toBe('self-uid');
  });

  it('should not replace strings that are not uids', () => {
    const model = flowEngine.createModel({
      uid: 'model-uid',
      use: 'FlowModel',
      props: {
        title: 'Some Title',
        description: 'This is a description',
        count: 42,
        enabled: true,
      },
    });

    const cloned = model.clone();

    // Non-uid strings should remain unchanged
    expect(cloned.props.title).toBe('Some Title');
    expect(cloned.props.description).toBe('This is a description');
    expect(cloned.props.count).toBe(42);
    expect(cloned.props.enabled).toBe(true);
  });
});
