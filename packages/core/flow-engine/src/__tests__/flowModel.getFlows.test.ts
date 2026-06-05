/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { FlowEngine } from '../flowEngine';
import { FlowModel } from '../models/flowModel';

describe('FlowModel.getFlow(s) with instance + global registries', () => {
  class BaseModel extends FlowModel {}
  class ChildModel extends BaseModel {}

  it('merges static(global) and instance flows; instance overrides static', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ BaseModel, ChildModel });

    const childGR = (ChildModel as typeof FlowModel).globalFlowRegistry;
    childGR.addFlow('shared', {
      title: 'FromChildStatic',
      steps: { s: { title: 'S', handler: (ctx: any, params: any) => {} } },
    } as any);
    const parentGR = (BaseModel as typeof FlowModel).globalFlowRegistry;
    parentGR.addFlow('baseOnly', {
      title: 'FromBaseStatic',
      steps: { p: { title: 'P', handler: (ctx: any, params: any) => {} } },
    } as any);

    const model = engine.createModel<ChildModel>({ use: 'ChildModel', uid: 'm1' });

    // 实例添加 flow
    model.flowRegistry.addFlow('instanceOnly', {
      title: 'FromInstance',
      steps: { i: { title: 'I', handler: (ctx: any, params: any) => {} } },
    });

    // 读取单个 flow
    expect(model.getFlow('instanceOnly')!.title).toBe('FromInstance');
    expect(model.getFlow('shared')!.title).toBe('FromChildStatic');
    expect(model.getFlow('baseOnly')!.title).toBe('FromBaseStatic');

    // 实例覆盖同名静态 flow
    model.flowRegistry.addFlow('shared', {
      title: 'FromInstanceOverride',
      steps: { ii: { title: 'II', handler: (ctx: any, params: any) => {} } },
    });
    expect(model.getFlow('shared')!.title).toBe('FromInstanceOverride');

    // getFlows 合并结果
    const allFlows = model.getFlows();
    expect(allFlows).toBeInstanceOf(Map);
    expect(allFlows.has('instanceOnly')).toBe(true);
    expect(allFlows.has('shared')).toBe(true);
    expect(allFlows.has('baseOnly')).toBe(true);
    expect(allFlows.get('shared')!.title).toBe('FromInstanceOverride');
  });
});
