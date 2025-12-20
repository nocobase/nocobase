/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { reaction } from '@nocobase/flow-engine';
import { beforeEach, describe, expect, it } from 'vitest';
import { FlowEngine } from '../flowEngine';
import { FlowModel } from '../models';

describe('FlowEngine moveModel', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
    engine.registerModels({ FlowModel });
  });

  it('keeps subModels array reactive after move so later additions trigger reactions', async () => {
    const parent = engine.createModel({ uid: 'parent', use: 'FlowModel' });
    parent.addSubModel('items', { uid: 'child-a', use: 'FlowModel' });
    parent.addSubModel('items', { uid: 'child-b', use: 'FlowModel' });

    await engine.moveModel('child-a', 'child-b', { persist: false });

    const seen: number[] = [];
    const dispose = reaction(
      () => ((parent.subModels as any).items as FlowModel[]).length,
      (next) => {
        seen.push(next);
      },
    );

    parent.addSubModel('items', { uid: 'child-c', use: 'FlowModel' });

    dispose();
    expect(seen).toEqual([3]);
  });
});
