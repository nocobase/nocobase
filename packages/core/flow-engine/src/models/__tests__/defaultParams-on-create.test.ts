/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FlowEngine } from '../../flowEngine';
import { defineFlow, FlowModel } from '../flowModel';

describe('FlowDefinition.defaultParams applied at createModel', () => {
  it('fills missing stepParams on createModel (flowKey present in returned object)', async () => {
    class ModelA extends FlowModel {}
    ModelA.registerFlow(
      defineFlow({
        key: 'alpha',
        steps: { s1: {} },
        defaultParams: () => ({
          alpha: { s1: { a: 1 } },
        }),
      }),
    );

    const engine = new FlowEngine();
    engine.registerModels({ ModelA });
    const m = engine.createModel<ModelA>({ use: 'ModelA', uid: 'm-alpha' });

    await waitFor(() => {
      expect(m.getStepParams('alpha', 's1')).toEqual({ a: 1 });
    });
  });

  it('does not override existing stepParams', async () => {
    class ModelB extends FlowModel {}
    ModelB.registerFlow(
      defineFlow({
        key: 'alpha',
        steps: { s1: {} },
        defaultParams: () => ({ alpha: { s1: { a: 1 } } }),
      }),
    );

    const engine = new FlowEngine();
    engine.registerModels({ ModelB });
    const m = engine.createModel<ModelB>({
      use: 'ModelB',
      uid: 'm-beta',
      stepParams: { alpha: { s1: { a: 42 } } },
    });

    await waitFor(() => {
      expect(m.getStepParams('alpha', 's1')).toEqual({ a: 42 });
    });
  });

  it('accepts defaultParams without outer flowKey (applies to current flow)', async () => {
    class ModelC extends FlowModel {}
    ModelC.registerFlow(
      defineFlow({
        key: 'beta',
        steps: { s1: {} },
        defaultParams: () => ({ s1: { b: 2 } }),
      }),
    );

    const engine = new FlowEngine();
    engine.registerModels({ ModelC });
    const m = engine.createModel<ModelC>({ use: 'ModelC', uid: 'm-gamma' });

    await waitFor(() => {
      expect(m.getStepParams('beta', 's1')).toEqual({ b: 2 });
    });
  });

  it('partially fills only missing steps', async () => {
    class ModelD extends FlowModel {}
    ModelD.registerFlow(
      defineFlow({
        key: 'theta',
        steps: { s1: {}, s2: {} },
        defaultParams: () => ({ theta: { s1: { a: 1 }, s2: { b: 2 } } }),
      }),
    );

    const engine = new FlowEngine();
    engine.registerModels({ ModelD });
    const m = engine.createModel<ModelD>({
      use: 'ModelD',
      uid: 'm-theta',
      stepParams: { theta: { s1: { a: 99 } } },
    });

    await waitFor(() => {
      expect(m.getStepParams('theta', 's1')).toEqual({ a: 99 }); // unchanged
      expect(m.getStepParams('theta', 's2')).toEqual({ b: 2 }); // filled
    });
  });

  it('supports multi-flow shape and only applies to current flowKey', async () => {
    class ModelE extends FlowModel {}
    // register two flows with same default provider returning both keys
    const defaults = () => ({
      foo: { s1: { x: 1 } },
      bar: { s2: { y: 2 } },
    });
    ModelE.registerFlow(
      defineFlow({
        key: 'foo',
        steps: { s1: {} },
        defaultParams: defaults,
      }),
    );
    ModelE.registerFlow(
      defineFlow({
        key: 'bar',
        steps: { s2: {} },
        defaultParams: defaults,
      }),
    );

    const engine = new FlowEngine();
    engine.registerModels({ ModelE });
    const m = engine.createModel<ModelE>({ use: 'ModelE', uid: 'm-e' });

    await waitFor(() => {
      expect(m.getStepParams('foo', 's1')).toEqual({ x: 1 });
      expect(m.getStepParams('bar', 's2')).toEqual({ y: 2 });
    });
  });
});
