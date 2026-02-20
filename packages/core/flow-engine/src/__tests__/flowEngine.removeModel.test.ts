/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { FlowEngine } from '../flowEngine';
import { FlowModel } from '../models';

describe('FlowEngine removeModel', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
    engine.registerModels({ FlowModel });
  });

  it('removeModel should remove model but keep sub-models in cache (current behavior)', () => {
    const parent = engine.createModel({ uid: 'parent', use: 'FlowModel' });
    const child = engine.createModel({
      uid: 'child',
      use: 'FlowModel',
      parentId: 'parent',
      subKey: 'child',
      subType: 'object',
    });

    expect(engine.getModel('parent')).toBe(parent);
    expect(engine.getModel('child')).toBe(child);

    engine.removeModel('parent');

    expect(engine.getModel('parent')).toBeUndefined();
    // Current behavior: child is still in cache
    expect(engine.getModel('child')).toBeDefined();
  });

  it('removeModelWithSubModels should remove model and all sub-models from cache', () => {
    const parent = engine.createModel({ uid: 'parent', use: 'FlowModel' });
    const child = engine.createModel({
      uid: 'child',
      use: 'FlowModel',
      parentId: 'parent',
      subKey: 'child',
      subType: 'object',
    });
    parent.setSubModel('child', child);

    const grandChild = engine.createModel({
      uid: 'grandChild',
      use: 'FlowModel',
      parentId: 'child',
      subKey: 'grandChild',
      subType: 'object',
    });
    child.setSubModel('grandChild', grandChild);

    expect(engine.getModel('parent')).toBe(parent);
    expect(engine.getModel('child')).toBe(child);
    expect(engine.getModel('grandChild')).toBe(grandChild);

    engine.removeModelWithSubModels('parent');

    expect(engine.getModel('parent')).toBeUndefined();
    expect(engine.getModel('child')).toBeUndefined();
    expect(engine.getModel('grandChild')).toBeUndefined();
  });
});
