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

describe('FlowModel cleanRun + setProps', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
  });

  it('resets props modified by auto flow between runs when cleanRun=true', async () => {
    class DemoModel extends FlowModel<any> {
      static {
        // auto flow increments props.count by 1
        this.registerFlow({
          key: 'autoCounter',
          steps: {
            bump: {
              handler: (ctx) => {
                const props = ctx.model.getProps() as any;
                const prev = Number(props.count) || 0;
                ctx.model.setProps({ count: prev + 1 });
              },
            },
          },
        } as any);
      }
    }

    engine.registerModels({ DemoModel });

    const model = engine.createModel<DemoModel>({ use: 'DemoModel', cleanRun: true });

    // First run: should set count to 1
    await model.applyAutoFlows(undefined, false);
    expect((model.getProps() as any).count).toBe(1);

    // Simulate user modifying some settings that triggers re-run (or explicit rerun)
    // Here we call applyAutoFlows again to emulate a subsequent automatic run
    await model.applyAutoFlows(undefined, false);

    // With cleanRun, baseline props are restored before each run, so count stays 1
    expect((model.getProps() as any).count).toBe(1);

    // Simulate user modifying some settings that triggers re-run (or explicit rerun)
    // Here we call applyAutoFlows again to emulate a subsequent automatic run
    await model.applyAutoFlows(undefined, false);

    // With cleanRun, baseline props are restored before each run, so count stays 1
    expect((model.getProps() as any).count).toBe(1);
  });

  it('accumulates props when cleanRun=false', async () => {
    class DemoModel extends FlowModel<any> {
      static {
        this.registerFlow({
          key: 'autoCounter',
          steps: {
            bump: {
              handler: (ctx) => {
                const props = ctx.model.getProps() as any;
                const prev = Number(props.count) || 0;
                ctx.model.setProps({ count: prev + 1 });
              },
            },
          },
        } as any);
      }
    }

    engine.registerModels({ DemoModel });

    const model = engine.createModel<DemoModel>({ use: 'DemoModel', cleanRun: false });

    await model.applyAutoFlows(undefined, false);
    expect((model.getProps() as any).count).toBe(1);

    await model.applyAutoFlows(undefined, false);
    // Without cleanRun, count should accumulate to 2
    expect((model.getProps() as any).count).toBe(2);
  });
});
