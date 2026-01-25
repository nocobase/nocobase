/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { FlowEngine } from '../../flowEngine';
import { ErrorFlowModel, FlowModel } from '../flowModel';

describe('FlowEngine.createModel resolveUse hook', () => {
  let engine: FlowEngine;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    engine = new FlowEngine();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  test('should use resolveUse returning registered name', () => {
    class DynamicTarget extends FlowModel {}
    class DynamicEntry extends FlowModel {
      static resolveUse() {
        return 'DynamicTarget';
      }
    }

    engine.registerModels({ DynamicEntry, DynamicTarget });

    const model = engine.createModel({ use: 'DynamicEntry', uid: 'dynamic-entry', flowEngine: engine });

    expect(model).toBeInstanceOf(DynamicTarget);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('should chain resolveUse until final constructor', () => {
    class ChainLeaf extends FlowModel {}
    class ChainMid extends FlowModel {
      static resolveUse() {
        return ChainLeaf;
      }
    }
    class ChainStart extends FlowModel {
      static resolveUse() {
        return 'ChainMid';
      }
    }

    engine.registerModels({ ChainLeaf, ChainMid, ChainStart });

    const model = engine.createModel({ use: 'ChainStart', uid: 'chain-start', flowEngine: engine });

    expect(model).toBeInstanceOf(ChainLeaf);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('should break resolveUse on circular reference and warn', () => {
    class LoopModel extends FlowModel {
      static resolveUse() {
        return 'LoopModel';
      }
    }

    engine.registerModels({ LoopModel });

    const model = engine.createModel({ use: 'LoopModel', uid: 'loop-model', flowEngine: engine });

    expect(model).toBeInstanceOf(LoopModel);
    expect(warnSpy).toHaveBeenCalled();
  });

  test('should fall back to ErrorFlowModel when resolveUse returns unregistered name', () => {
    class MissingTargetEntry extends FlowModel {
      static resolveUse() {
        return 'NoSuchModel';
      }
    }

    engine.registerModels({ MissingTargetEntry });

    const model = engine.createModel({ use: 'MissingTargetEntry', uid: 'missing-target', flowEngine: engine });

    expect(model).toBeInstanceOf(ErrorFlowModel);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("resolveUse returned 'NoSuchModel' but no model is registered under that name."),
    );
  });

  test('should keep original use in serialized data after resolveUse', () => {
    class DynamicTarget extends FlowModel {}
    class DynamicEntry extends FlowModel {
      static resolveUse() {
        return DynamicTarget;
      }
    }

    engine.registerModels({ DynamicEntry, DynamicTarget });

    const model = engine.createModel({ use: 'DynamicEntry', uid: 'dynamic-entry', flowEngine: engine });
    const serialized = model.serialize();

    expect(model).toBeInstanceOf(DynamicTarget);
    expect(serialized.use).toBe('DynamicEntry');
  });

  test('should receive parent model in resolveUse for sub-model decision', () => {
    class ChildA extends FlowModel {}
    class ChildB extends FlowModel {}
    class Parent extends FlowModel {}
    class ChildEntry extends FlowModel {
      static resolveUse(options, _engine, parent?: FlowModel) {
        return parent?.props?.variant === 'B' ? 'ChildB' : 'ChildA';
      }
    }

    engine.registerModels({ Parent, ChildEntry, ChildA, ChildB });

    const parentA = engine.createModel({ use: 'Parent', uid: 'p-a', flowEngine: engine, props: { variant: 'A' } });
    const childA = engine.createModel({
      use: 'ChildEntry',
      uid: 'c-a',
      flowEngine: engine,
      parentId: parentA.uid,
      subKey: 'child',
    });
    expect(childA).toBeInstanceOf(ChildA);

    const parentB = engine.createModel({ use: 'Parent', uid: 'p-b', flowEngine: engine, props: { variant: 'B' } });
    const childB = engine.createModel({
      use: 'ChildEntry',
      uid: 'c-b',
      flowEngine: engine,
      parentId: parentB.uid,
      subKey: 'child',
    });
    expect(childB).toBeInstanceOf(ChildB);
  });

  test('should stop resolveUse chain when stop flag is true', () => {
    const leafSpy = vi.fn();

    class Leaf extends FlowModel {
      static resolveUse = leafSpy;
    }
    class Mid extends FlowModel {
      static resolveUse() {
        return 'Leaf';
      }
    }
    class Entry extends FlowModel {
      static resolveUse() {
        return { use: 'Mid', stop: true };
      }
    }

    engine.registerModels({ Entry, Mid, Leaf });

    const model = engine.createModel({ use: 'Entry', uid: 'stop-flag', flowEngine: engine });

    expect(model).toBeInstanceOf(Mid);
    expect(leafSpy).not.toHaveBeenCalled();
  });
});
