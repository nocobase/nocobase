/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, test, expect } from 'vitest';
import { FlowEngine } from '../../flowEngine';
import { FlowModel } from '../../models/flowModel';
import { isBeforeRenderFlow } from '../index';

describe('utils/isBeforeRenderFlow', () => {
  test('identifies beforeRender by on string', () => {
    const engine = new FlowEngine();
    class M extends FlowModel {}
    engine.registerModels({ M });
    const m = engine.createModel({ use: 'M' });
    m.registerFlow('A', { on: 'beforeRender', steps: {} });
    const flow = m.flowRegistry.getFlow('A')!;
    expect(isBeforeRenderFlow(flow)).toBe(true);
  });

  test('identifies beforeRender by on object', () => {
    const engine = new FlowEngine();
    class M extends FlowModel {}
    engine.registerModels({ M });
    const m = engine.createModel({ use: 'M' });
    m.registerFlow('B', { on: { eventName: 'beforeRender' }, steps: {} });
    const flow = m.flowRegistry.getFlow('B')!;
    expect(isBeforeRenderFlow(flow)).toBe(true);
  });

  test('treats missing on and non-manual as beforeRender', () => {
    const engine = new FlowEngine();
    class M extends FlowModel {}
    engine.registerModels({ M });
    const m = engine.createModel({ use: 'M' });
    m.registerFlow('C', { steps: {} });
    const flow = m.flowRegistry.getFlow('C')!;
    expect(isBeforeRenderFlow(flow)).toBe(true);
  });

  test('manual flow is not beforeRender when on is missing', () => {
    const engine = new FlowEngine();
    class M extends FlowModel {}
    engine.registerModels({ M });
    const m = engine.createModel({ use: 'M' });
    m.registerFlow('D', { manual: true, steps: {} });
    const flow = m.flowRegistry.getFlow('D')!;
    expect(isBeforeRenderFlow(flow)).toBe(false);
  });

  test('non-beforeRender event is not beforeRender', () => {
    const engine = new FlowEngine();
    class M extends FlowModel {}
    engine.registerModels({ M });
    const m = engine.createModel({ use: 'M' });
    m.registerFlow('E', { on: { eventName: 'click' }, steps: {} });
    const flow = m.flowRegistry.getFlow('E')!;
    expect(isBeforeRenderFlow(flow)).toBe(false);
  });
});
