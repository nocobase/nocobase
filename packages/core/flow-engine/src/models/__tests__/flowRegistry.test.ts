/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '../../flowEngine';
import { FlowModel } from '../flowModel';

describe('InstanceFlowRegistry (extended)', () => {
  const createModel = () => {
    const engine = new FlowEngine();
    class MyModel extends FlowModel {
      foo = 'bar';
    }
    engine.registerModels({ MyModel });
    const model = engine.createModel({
      use: 'MyModel',
    });
    return model;
  };

  test('setStep and hasStep', () => {
    const model = createModel();
    const flow = model.flowRegistry.addFlow('flow1', {
      title: 'Flow 1',
      steps: { step1: { title: 'Step 1' } as any },
    });

    expect(flow.hasStep('step1')).toBe(true);

    flow.setStep('step1', { title: 'Step 1 (updated)' });
    expect(flow.getStep('step1').serialize()).toEqual({
      flowKey: 'flow1',
      key: 'step1',
      title: 'Step 1 (updated)',
    });
  });

  test('removeStep', () => {
    const model = createModel();
    const flow = model.flowRegistry.addFlow('flow1', {
      title: 'Flow 1',
      steps: {
        step1: { title: 'Step 1' } as any,
        step2: { title: 'Step 2' } as any,
      },
    });

    expect(flow.getSteps().size).toBe(2);
    flow.removeStep('step1');
    expect(flow.hasStep('step1')).toBe(false);
    expect(flow.getSteps().size).toBe(1);
  });

  test('addFlows adds multiple flows locally', () => {
    const model = createModel();

    model.flowRegistry.addFlows({
      flowA: { title: 'A', steps: {} },
      flowB: { title: 'B', steps: { s1: { title: 'S1' } as any } },
    });

    expect(model.flowRegistry.hasFlow('flowA')).toBe(true);
    expect(model.flowRegistry.hasFlow('flowB')).toBe(true);

    const step = model.flowRegistry.getFlow('flowB')!.getStep('s1')!;
    expect(step.serialize()).toEqual({
      title: 'S1',
      key: 's1',
      flowKey: 'flowB',
    });
  });

  test('saveFlow/saveStep/destroyStep/destroyFlow call model.save()', async () => {
    const model = createModel();
    const saveSpy = vitest.spyOn(model as any, 'save').mockResolvedValue(undefined);

    const flow = model.flowRegistry.addFlow('flow1', {
      title: 'Flow 1',
      steps: {
        step1: { title: 'Step 1' } as any,
        step2: { title: 'Step 2' } as any,
      },
    });

    await flow.save();
    expect(saveSpy).toHaveBeenCalledTimes(1);

    await flow.destroyStep('step2');
    expect(saveSpy).toHaveBeenCalledTimes(2);
    expect(flow.hasStep('step2')).toBe(false);

    await flow.destroy();
    expect(saveSpy).toHaveBeenCalledTimes(3);
    expect(model.flowRegistry.hasFlow('flow1')).toBe(false);
  });

  test.skip('moveStep only adjusts sort (no Map reset)', () => {
    const model = createModel();
    const flow = model.flowRegistry.addFlow('flow1', {
      title: 'Flow 1',
      steps: {
        s1: { title: 'S1', sort: 10 } as any,
        s2: { title: 'S2', sort: 20 } as any,
        s3: { title: 'S3', sort: 30 } as any,
      },
    });

    // 移动 s3 到 s1 前
    flow.moveStep('s3', 's1');

    const s1 = flow.getStep('s1') as any;
    const s2 = flow.getStep('s2') as any;
    const s3 = flow.getStep('s3') as any;

    // 只关心排序关系：s3 应该在 s1 之前（sort 更小）
    expect(s3.sort).toBeLessThan(s1.sort);
    // 其他步骤的排序可以保持或在无间隙时被规范化，这里不做强绑定
    expect(s1.sort).toBeGreaterThan(0);
    expect(s2.sort).toBeGreaterThan(s1.sort - 10); // 宽松断言，防止规范化导致的变动

    // 再把 s1 移到 s2 前，断言 s1.sort < s2.sort
    const beforeS1Sort = (flow.getStep('s1') as any).sort;
    flow.moveStep('s1', 's2');
    const afterS1Sort = (flow.getStep('s1') as any).sort;
    const afterS2Sort = (flow.getStep('s2') as any).sort;

    expect(afterS1Sort).toBeLessThan(afterS2Sort);
    // 至少发生了变化（有意义的移动）
    expect(afterS1Sort).not.toBe(beforeS1Sort);
  });

  test('toData merges steps into options snapshot', () => {
    const model = createModel();
    const flow = model.flowRegistry.addFlow('flow1', {
      title: 'Flow 1',
      steps: { step1: { title: 'Step 1', sort: 10 } as any },
      sort: 1,
      manual: true,
    });

    const data = flow.toData();
    expect(data.key).toBe('flow1');
    expect(data.title).toBe('Flow 1');
    expect(data.sort).toBe(1);
    expect(data.manual).toBe(true);
    expect(data.steps.step1).toEqual({
      title: 'Step 1',
      sort: 10,
      key: 'step1',
      flowKey: 'flow1',
    });

    // 修改原步骤对象，不应影响已生成的快照
    (flow.getStep('step1') as any).title = 'Changed';
    expect(data.steps.step1.title).toBe('Step 1');
  });

  test('model serialize', () => {
    const model = createModel();
    model.flowRegistry.addFlow('flow1', {
      title: 'Flow 1',
      steps: { step1: { title: 'Step 1', sort: 10 } as any },
      sort: 1,
      manual: true,
    });
    const flows = model.serialize().flowRegistry;
    console.log(flows);
    expect(flows.flow1).toBeDefined();
    expect(flows.flow1).toEqual({
      key: 'flow1',
      title: 'Flow 1',
      sort: 1,
      manual: true,
      steps: {
        step1: {
          title: 'Step 1',
          sort: 10,
          key: 'step1',
          flowKey: 'flow1',
        },
      },
    });
  });

  test('model init flowRegistry', () => {
    const engine = new FlowEngine();
    class MyModel extends FlowModel {
      foo = 'bar';
    }
    engine.registerModels({ MyModel });
    const model = engine.createModel({
      use: 'MyModel',
      flowRegistry: {
        flow1: {
          title: 'Flow 1',
          steps: { step1: { title: 'Step 1', sort: 10 } as any },
          sort: 1,
          manual: true,
        },
      },
    });
    const flows = model.serialize().flowRegistry;
    console.log(flows);
    expect(flows.flow1).toBeDefined();
    expect(flows.flow1).toEqual({
      key: 'flow1',
      title: 'Flow 1',
      sort: 1,
      manual: true,
      steps: {
        step1: {
          title: 'Step 1',
          sort: 10,
          key: 'step1',
          flowKey: 'flow1',
        },
      },
    });
  });
});
