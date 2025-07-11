/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowEngine } from '../flowEngine';
import { FlowModel } from '../models';

class BaseModel extends FlowModel {}
class SubModelA extends BaseModel {}
class SubModelB extends BaseModel {}
class SubModelC extends SubModelA {}

describe('FlowEngine', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
    engine.registerModels({
      BaseModel,
      SubModelA,
      SubModelB,
      SubModelC,
    });
  });

  it('getModelClass should return correct class', () => {
    expect(engine.getModelClass('BaseModel')).toBe(BaseModel);
    expect(engine.getModelClass('SubModelA')).toBe(SubModelA);
    expect(engine.getModelClass('NotExist')).toBeUndefined();
  });

  it('getSubclassesOf should return all subclasses', () => {
    const result = engine.getSubclassesOf(BaseModel);
    expect(result.has('BaseModel')).toBe(false);
    expect(result.has('SubModelA')).toBe(true);
    expect(result.has('SubModelB')).toBe(true);
    expect(result.has('SubModelC')).toBe(true);
  });

  it('getSubclassesOf should support filter', () => {
    const result = engine.getSubclassesOf(BaseModel, (ModelClass, name) => name.startsWith('SubModel'));
    expect(result.has('BaseModel')).toBe(false);
    expect(result.has('SubModelA')).toBe(true);
    expect(result.has('SubModelB')).toBe(true);
    expect(result.has('SubModelC')).toBe(true);
  });

  it('findModelClass should find by predicate', () => {
    const found = engine.findModelClass((name) => name === 'SubModelB');
    expect(found).toBeDefined();
    expect(found?.[0]).toBe('SubModelB');
    expect(found?.[1]).toBe(SubModelB);
  });

  it('filterModelClassByParent should return correct subclasses', () => {
    const result = engine.filterModelClassByParent(SubModelA);
    expect(result.has('SubModelA')).toBe(false);
    expect(result.has('SubModelC')).toBe(true);
    expect(result.has('BaseModel')).toBe(false);
    expect(result.has('SubModelB')).toBe(false);
  });

  it('registerAction/getAction should work', () => {
    engine.registerAction('testAction', { handler: vi.fn(), name: 'testAction' });
    const action = engine.getAction('testAction');
    expect(action).toBeDefined();
    expect(action?.name).toBe('testAction');
  });

  it('registerModels should overwrite existing model', () => {
    class NewBaseModel {}
    engine.registerModels({ BaseModel: NewBaseModel });
    expect(engine.getModelClass('BaseModel')).toBe(NewBaseModel);
  });
});
