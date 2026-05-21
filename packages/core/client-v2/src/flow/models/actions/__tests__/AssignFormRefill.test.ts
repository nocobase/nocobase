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
import { UpdateRecordActionModel } from '../../..'; // 这样可以解决循环依赖问题

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
});
