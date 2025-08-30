/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vitest } from 'vitest';
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
      sort: 1,
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

    const flow = model.flowRegistry.getFlow('flowB');
    const step = flow?.getStep('s1');
    expect(step?.serialize()).toEqual({
      title: 'S1',
      key: 's1',
      flowKey: 'flowB',
      sort: 1,
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

  // InstanceFlowRegistry moveStep tests
  test('moveStep reorders steps with integer sort values', async () => {
    const model = createModel();
    const flow = model.flowRegistry.addFlow('testFlow', {
      title: 'Test Flow',
      steps: {
        step1: { title: 'Step 1' } as any,
        step2: { title: 'Step 2' } as any,
        step3: { title: 'Step 3' } as any,
      },
    });

    // Move step3 before step2
    await model.flowRegistry.moveStep('testFlow', 'step3', 'step2');

    // Verify new order
    const reorderedSteps = Object.keys(flow.steps);
    expect(reorderedSteps).toEqual(['step1', 'step3', 'step2']);

    // Verify sort values are integers and in correct order
    expect(flow.getStep('step1')?.serialize().sort).toBe(1);
    expect(flow.getStep('step3')?.serialize().sort).toBe(2);
    expect(flow.getStep('step2')?.serialize().sort).toBe(3);
  });

  test('moveStep calls model.save after reordering', async () => {
    const model = createModel();
    const saveSpy = vitest.spyOn(model as any, 'save').mockResolvedValue(undefined);

    model.flowRegistry.addFlow('testFlow', {
      title: 'Test Flow',
      steps: {
        step1: { title: 'Step 1' } as any,
        step2: { title: 'Step 2' } as any,
      },
    });

    await model.flowRegistry.moveStep('testFlow', 'step1', 'step2');

    expect(saveSpy).toHaveBeenCalledTimes(1);
    saveSpy.mockRestore();
  });

  test('moveStep throws error for non-existent flow', async () => {
    const model = createModel();
    const saveSpy = vitest.spyOn(model as any, 'save').mockResolvedValue(undefined);

    await expect(model.flowRegistry.moveStep('nonExistentFlow', 'step1', 'step2')).rejects.toThrow(
      "Flow 'nonExistentFlow' not found",
    );

    expect(saveSpy).not.toHaveBeenCalled();
    saveSpy.mockRestore();
  });

  test('moveStep throws error for non-existent steps', async () => {
    const model = createModel();
    const saveSpy = vitest.spyOn(model as any, 'save').mockResolvedValue(undefined);

    model.flowRegistry.addFlow('testFlow', {
      title: 'Test Flow',
      steps: {
        step1: { title: 'Step 1' } as any,
        step2: { title: 'Step 2' } as any,
      },
    });

    await expect(model.flowRegistry.moveStep('testFlow', 'nonExistentStep', 'step2')).rejects.toThrow(
      "Source step 'nonExistentStep' not found",
    );

    expect(saveSpy).not.toHaveBeenCalled();
    saveSpy.mockRestore();
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

  // mapFlows 方法
  test('mapFlows iterates over all flows', () => {
    const model = createModel();
    model.flowRegistry.addFlows({
      flow1: { title: 'Flow 1', steps: {} },
      flow2: { title: 'Flow 2', steps: {} },
      flow3: { title: 'Flow 3', steps: {} },
    });

    const titles = model.flowRegistry.mapFlows((flow) => flow.title);
    expect(titles).toEqual(['Flow 1', 'Flow 2', 'Flow 3']);

    const keys = model.flowRegistry.mapFlows((flow) => flow.key);
    expect(keys).toEqual(['flow1', 'flow2', 'flow3']);
  });

  // getFlows 返回 Map
  test('getFlows returns Map of flows', () => {
    const model = createModel();
    model.flowRegistry.addFlow('test', { title: 'Test', steps: {} });

    const flows = model.flowRegistry.getFlows();
    expect(flows instanceof Map).toBe(true);
    expect(flows.size).toBe(1);
    expect(flows.has('test')).toBe(true);
  });

  // removeFlow 独立测试
  test('removeFlow deletes flow from registry', () => {
    const model = createModel();
    model.flowRegistry.addFlow('test', { title: 'Test', steps: {} });

    expect(model.flowRegistry.hasFlow('test')).toBe(true);
    model.flowRegistry.removeFlow('test');
    expect(model.flowRegistry.hasFlow('test')).toBe(false);
  });

  // FlowDefinition setters
  test('FlowDefinition setters update properties', () => {
    const model = createModel();
    const flow = model.flowRegistry.addFlow('test', {
      title: 'Test',
      manual: false,
      on: 'update',
      steps: {},
    });

    flow.title = 'Updated Title';
    flow.manual = true;
    flow.on = 'create';

    expect(flow.title).toBe('Updated Title');
    expect(flow.manual).toBe(true);
    expect(flow.on).toBe('create');
  });

  // FlowDefinition setOptions
  test('FlowDefinition setOptions updates flow properties', () => {
    const model = createModel();
    const flow = model.flowRegistry.addFlow('test', { title: 'Test', steps: {} });

    flow.setOptions({
      title: 'New Title',
      sort: 10,
      manual: true,
      on: 'delete',
    });

    expect(flow.title).toBe('New Title');
    expect(flow.sort).toBe(10);
    expect(flow.manual).toBe(true);
    expect(flow.on).toBe('delete');
  });

  // mapSteps 方法
  test('FlowDefinition mapSteps iterates over all steps', () => {
    const model = createModel();
    const flow = model.flowRegistry.addFlow('test', {
      title: 'Test',
      steps: {
        step1: { title: 'Step 1', sort: 10 } as any,
        step2: { title: 'Step 2', sort: 20 } as any,
        step3: { title: 'Step 3', sort: 30 } as any,
      },
    });

    const stepTitles = flow.mapSteps((step) => step.title);
    expect(stepTitles).toEqual(['Step 1', 'Step 2', 'Step 3']);

    const stepKeys = flow.mapSteps((step) => step.key);
    expect(stepKeys).toEqual(['step1', 'step2', 'step3']);
  });

  // FlowStep 属性和方法
  test('FlowStep properties and methods', () => {
    const model = createModel();
    const flow = model.flowRegistry.addFlow('test', {
      title: 'Test',
      steps: {
        step1: {
          title: 'Step 1',
          uiSchema: { type: 'object' },
          defaultParams: { param1: 'value1' },
          use: 'someAction',
          sort: 10,
        } as any,
      },
    });

    const step = flow.getStep('step1');
    expect(step?.key).toBe('step1');
    expect(step?.flowKey).toBe('test');
    expect(step?.title).toBe('Step 1');
    expect(step?.uiSchema).toEqual({ type: 'object' });
    expect(step?.defaultParams).toEqual({ param1: 'value1' });
    expect(step?.use).toBe('someAction');

    // 测试 title setter
    if (step) {
      step.title = 'Updated Step Title';
      expect(step.title).toBe('Updated Step Title');
    }
  });

  // FlowStep setOptions
  test('FlowStep setOptions updates step properties', () => {
    const model = createModel();
    const flow = model.flowRegistry.addFlow('test', {
      title: 'Test',
      steps: {
        step1: { title: 'Step 1' } as any,
      },
    });

    const step = flow.getStep('step1');
    if (step) {
      step.setOptions({
        title: 'Updated Step',
        uiSchema: {
          test: {
            type: 'string',
          },
        },
        defaultParams: { newParam: 'newValue' },
        use: 'newAction',
      });

      expect(step.title).toBe('Updated Step');
      expect(step.uiSchema).toEqual({ test: { type: 'string' } });
      expect(step.defaultParams).toEqual({ newParam: 'newValue' });
      expect(step.use).toBe('newAction');
    }
  });

  // 边界情况和错误处理
  test('handles non-existent flow operations gracefully', () => {
    const model = createModel();

    expect(model.flowRegistry.getFlow('nonexistent')).toBeUndefined();
    expect(model.flowRegistry.hasFlow('nonexistent')).toBe(false);

    // removeFlow on non-existent should not throw
    expect(() => model.flowRegistry.removeFlow('nonexistent')).not.toThrow();

    // mapFlows on empty registry
    const emptyResults = model.flowRegistry.mapFlows((flow) => flow.title);
    expect(emptyResults).toEqual([]);
  });

  // addStep 与现有 key 的行为
  test('addStep with existing key updates step', () => {
    const model = createModel();
    const flow = model.flowRegistry.addFlow('test', {
      title: 'Test',
      steps: { step1: { title: 'Original' } as any },
    });

    expect(flow.getSteps().size).toBe(1);
    expect(flow.getStep('step1')?.title).toBe('Original');

    // 使用相同的 key 添加步骤应该更新现有步骤
    const updatedStep = flow.addStep('step1', { title: 'Updated' });
    expect(updatedStep.title).toBe('Updated');
    expect(flow.getSteps().size).toBe(1); // 仍然只有一个步骤
    expect(flow.getStep('step1')?.title).toBe('Updated');
  });

  // FlowStep 的异步方法
  test('FlowStep async methods call flowDef methods', async () => {
    const model = createModel();
    const saveSpy = vitest.spyOn(model as any, 'save').mockResolvedValue(undefined);

    const flow = model.flowRegistry.addFlow('test', {
      title: 'Test',
      steps: { step1: { title: 'Step 1' } as any },
    });

    const step = flow.getStep('step1');

    // 测试 step.save()
    if (step) {
      await step.save();
      expect(saveSpy).toHaveBeenCalledTimes(1);

      // 测试 step.remove()
      step.remove();
      expect(flow.hasStep('step1')).toBe(false);
    }

    // 重新添加步骤来测试 destroy
    flow.addStep('step2', { title: 'Step 2' });
    const step2 = flow.getStep('step2');

    if (step2) {
      await step2.destroy();
      expect(saveSpy).toHaveBeenCalledTimes(2);
      expect(flow.hasStep('step2')).toBe(false);
    }
  });

  // FlowDefinition defaultParams 的默认值
  test('FlowStep defaultParams returns empty object when undefined', () => {
    const model = createModel();
    const flow = model.flowRegistry.addFlow('test', {
      title: 'Test',
      steps: { step1: { title: 'Step 1' } as any }, // 没有 defaultParams
    });

    const step = flow.getStep('step1');
    expect(step?.defaultParams).toEqual({});
  });

  // 空的 addFlows 调用
  test('addFlows handles empty or null input', () => {
    const model = createModel();

    expect(() => model.flowRegistry.addFlows({})).not.toThrow();
    expect(() => model.flowRegistry.addFlows(null as any)).not.toThrow();
    expect(() => model.flowRegistry.addFlows(undefined as any)).not.toThrow();

    expect(model.flowRegistry.getFlows().size).toBe(0);
  });
});
