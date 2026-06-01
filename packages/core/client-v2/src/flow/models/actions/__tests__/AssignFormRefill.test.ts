/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { FormSubmitActionModel, UpdateRecordActionModel } from '../../..'; // 这样可以解决循环依赖问题

/**
 * 精简版 AssignFormModel（仅用于单测）：
 * - 避免依赖复杂上下文；专注验证 beforeParamsSave 的聚合入参写入逻辑。
 */
class TestAssignFormModel extends FlowModel {
  private _values: Record<string, any> = {};
  setAssignedValues(v: Record<string, any>) {
    this._values = v || {};
  }
  getAssignedValues(): Record<string, any> {
    return this._values || {};
  }
}

describe('AssignForm value refill and save (beforeParamsSave)', () => {
  it('UpdateRecordActionModel: saves non-empty assignedValues from AssignForm', async () => {
    const root = new FlowEngine();

    // 仅 root 引擎：真实场景视图作用域引擎由弹窗创建，此处不需 link 模拟
    root.registerModels({ UpdateRecordActionModel, AssignFormModel: TestAssignFormModel });

    const action = root.createModel<UpdateRecordActionModel>({ use: 'UpdateRecordActionModel', uid: 'act-u' });

    const form = root.createModel<TestAssignFormModel>({
      use: 'AssignFormModel',
      uid: 'form-u',
      parentId: action.uid,
      subKey: 'assignForm',
    });
    form.setAssignedValues({ nickname: 'Alice', score: 99 });
    (action as any).assignFormUid = form.uid;

    const flow = action.getFlow('assignSettings') as any;
    const step = flow?.steps?.assignFieldValues;
    expect(step?.beforeParamsSave).toBeTypeOf('function');

    await step.beforeParamsSave({ engine: root, model: action });

    const saved = action.getStepParams('assignSettings', 'assignFieldValues');
    expect(saved?.assignedValues).toEqual({ nickname: 'Alice', score: 99 });
  });

  it('UpdateRecordActionModel: saves assignedValues from assignForm subModel when assignFormUid is not ready', async () => {
    const root = new FlowEngine();
    root.registerModels({ UpdateRecordActionModel, AssignFormModel: TestAssignFormModel });

    const action = root.createModel<UpdateRecordActionModel>({ use: 'UpdateRecordActionModel', uid: 'act-u-sub' });
    const form = root.createModel<TestAssignFormModel>({
      use: 'AssignFormModel',
      uid: 'form-u-sub',
      parentId: action.uid,
      subKey: 'assignForm',
    });
    form.setAssignedValues({ nickname: 'Bob' });
    action.setSubModel('assignForm', form);

    const flow = action.getFlow('assignSettings') as any;
    const step = flow?.steps?.assignFieldValues;

    await step.beforeParamsSave({ engine: root, model: action }, {}, {});

    const saved = action.getStepParams('assignSettings', 'assignFieldValues');
    expect(saved?.assignedValues).toEqual({ nickname: 'Bob' });
  });

  it('UpdateRecordActionModel: keeps previous assignedValues when AssignForm is unavailable during save', async () => {
    const root = new FlowEngine();
    root.registerModels({ UpdateRecordActionModel, AssignFormModel: TestAssignFormModel });

    const action = root.createModel<UpdateRecordActionModel>({ use: 'UpdateRecordActionModel', uid: 'act-u-missing' });
    action.setStepParams('assignSettings', 'assignFieldValues', {});

    const flow = action.getFlow('assignSettings') as any;
    const step = flow?.steps?.assignFieldValues;

    await step.beforeParamsSave(
      { engine: root, model: action },
      {},
      {
        assignedValues: { nickname: 'Previous' },
      },
    );

    const saved = action.getStepParams('assignSettings', 'assignFieldValues');
    expect(saved?.assignedValues).toEqual({ nickname: 'Previous' });
  });

  it('FormSubmitActionModel: reuses assignFieldValues step and saves assignedValues from AssignForm', async () => {
    const root = new FlowEngine();

    root.registerModels({ FormSubmitActionModel, AssignFormModel: TestAssignFormModel });

    const action = root.createModel<FormSubmitActionModel>({ use: 'FormSubmitActionModel', uid: 'submit-u' });
    const form = root.createModel<TestAssignFormModel>({
      use: 'AssignFormModel',
      uid: 'submit-form-u',
      parentId: action.uid,
      subKey: 'assignForm',
    });
    form.setAssignedValues({ status: 'published' });
    action.assignFormUid = form.uid;

    const flow = action.getFlow('submitSettings') as any;
    const step = flow?.steps?.assignFieldValues;
    expect(step?.beforeParamsSave).toBeTypeOf('function');

    await step.beforeParamsSave({ engine: root, model: action });

    const saved = action.getStepParams('submitSettings', 'assignFieldValues');
    expect(saved?.assignedValues).toEqual({ status: 'published' });
  });

  it('FormSubmitActionModel: saves assignedValues from assignForm subModel when assignFormUid is not ready', async () => {
    const root = new FlowEngine();
    root.registerModels({ FormSubmitActionModel, AssignFormModel: TestAssignFormModel });

    const action = root.createModel<FormSubmitActionModel>({ use: 'FormSubmitActionModel', uid: 'submit-u-sub' });
    const form = root.createModel<TestAssignFormModel>({
      use: 'AssignFormModel',
      uid: 'submit-form-u-sub',
      parentId: action.uid,
      subKey: 'assignForm',
    });
    form.setAssignedValues({ status: 'draft' });
    action.setSubModel('assignForm', form);

    const flow = action.getFlow('submitSettings') as any;
    const step = flow?.steps?.assignFieldValues;

    await step.beforeParamsSave({ engine: root, model: action }, {}, {});

    const saved = action.getStepParams('submitSettings', 'assignFieldValues');
    expect(saved?.assignedValues).toEqual({ status: 'draft' });
  });

  it('FormSubmitActionModel: keeps previous assignedValues when AssignForm is unavailable during save', async () => {
    const root = new FlowEngine();
    root.registerModels({ FormSubmitActionModel, AssignFormModel: TestAssignFormModel });

    const action = root.createModel<FormSubmitActionModel>({ use: 'FormSubmitActionModel', uid: 'submit-u-missing' });
    action.setStepParams('submitSettings', 'assignFieldValues', {});

    const flow = action.getFlow('submitSettings') as any;
    const step = flow?.steps?.assignFieldValues;

    await step.beforeParamsSave(
      { engine: root, model: action },
      {},
      {
        assignedValues: { status: 'published' },
      },
    );

    const saved = action.getStepParams('submitSettings', 'assignFieldValues');
    expect(saved?.assignedValues).toEqual({ status: 'published' });
  });
});
