/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { FlowEngine, FlowModel, SingleRecordResource } from '@nocobase/flow-engine';
// 直接从 models 聚合导入，避免局部文件相互引用顺序导致的循环依赖
import { FormBlockModel } from '../../../..';
import { omitHiddenModelValuesFromSubmit } from '../submitValues';

class TestFormModel extends FormBlockModel {
  createResource(ctx: any, _params: any) {
    return ctx.createResource(SingleRecordResource);
  }

  renderComponent() {
    return null;
  }
}

function createEngine() {
  const engine = new FlowEngine();
  engine.registerModels({ TestFormModel });
  return engine;
}

function createFormBlock(engine: FlowEngine, uid: string) {
  return engine.createModel<TestFormModel>({
    use: 'TestFormModel',
    uid,
    stepParams: {
      resourceSettings: {
        init: { dataSourceKey: 'main', collectionName: 'orders' },
      },
    },
  });
}

function createFieldModel(
  engine: FlowEngine,
  uid: string,
  parent: FlowModel,
  options?: {
    hidden?: boolean;
    fieldPathArray?: Array<string | number>;
    stepFieldPath?: string;
    props?: Record<string, any>;
  },
) {
  const model = engine.createModel<FlowModel>({
    use: 'FlowModel',
    uid,
    parentId: parent.uid,
    stepParams: options?.stepFieldPath
      ? {
          fieldSettings: {
            init: { fieldPath: options.stepFieldPath },
          },
        }
      : undefined,
  });

  if (options?.fieldPathArray) {
    model.context.defineProperty('fieldPathArray', { value: options.fieldPathArray });
  }
  if (options?.props && typeof options.props === 'object') {
    model.setProps(options.props);
  }
  if (typeof options?.hidden === 'boolean') {
    model.hidden = options.hidden;
  }

  return model;
}

describe('omitHiddenModelValuesFromSubmit', () => {
  it('removes values for hidden fields in the same block', () => {
    const engine = createEngine();
    const blockModel = createFormBlock(engine, 'block-1');
    createFieldModel(engine, 'field-b', blockModel, { hidden: true, fieldPathArray: ['b'] });

    expect(omitHiddenModelValuesFromSubmit({ a: 1, b: 2 }, blockModel)).toEqual({ a: 1 });
  });

  it('does not remove values when model.hidden is false (Hidden (reserved value) semantics)', () => {
    const engine = createEngine();
    const blockModel = createFormBlock(engine, 'block-1');
    createFieldModel(engine, 'field-b', blockModel, { hidden: false, fieldPathArray: ['b'], props: { hidden: true } });

    expect(omitHiddenModelValuesFromSubmit({ a: 1, b: 2 }, blockModel)).toEqual({ a: 1, b: 2 });
  });

  it('resolves fork row index via fieldIndex and removes only the targeted row field', () => {
    const engine = createEngine();
    const blockModel = createFormBlock(engine, 'block-1');
    const master = createFieldModel(engine, 'field-list', blockModel, { stepFieldPath: 'list.x', hidden: false });
    const fork: any = master.createFork({}, 'row-0');
    fork.hidden = true;
    fork.context.defineProperty('fieldIndex', { value: ['list:0'] });

    expect(omitHiddenModelValuesFromSubmit({ list: [{ x: 1, y: 2 }] }, blockModel)).toEqual({ list: [{ y: 2 }] });
  });

  it('does not remove values for hidden models belonging to other blocks', () => {
    const engine = createEngine();
    const blockModel = createFormBlock(engine, 'block-1');
    const otherBlockModel = createFormBlock(engine, 'block-2');
    createFieldModel(engine, 'field-b2', otherBlockModel, { hidden: true, fieldPathArray: ['b'] });

    expect(omitHiddenModelValuesFromSubmit({ a: 1, b: 2 }, blockModel)).toEqual({ a: 1, b: 2 });
  });

  it('cleans up empty plain-object ancestors (but keeps arrays intact)', () => {
    const engine = createEngine();
    const blockModel = createFormBlock(engine, 'block-1');
    createFieldModel(engine, 'field-ab', blockModel, { hidden: true, stepFieldPath: 'a.b' });

    expect(omitHiddenModelValuesFromSubmit({ a: { b: 1 } }, blockModel)).toEqual({});
  });
});
