/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 */

import React from 'react';
import { FlowModelRenderer, SingleRecordResource, escapeT } from '@nocobase/flow-engine';
import { FormComponent, FormModel } from '../data-blocks/form/FormModel';

/**
 * 赋值配置表单（2.0）：外层为 FormModel（与 CreateFormModel 一致），
 * grid 子模型使用 AssignFieldGridModel，行内字段项为 FieldAssignItemModel。
 */
export class AssignFieldsFormModel extends FormModel {
  onInit(options: any) {
    super.onInit(options);
    try {
      const params = this.getStepParams('resourceSettings', 'init') || {};
      if (!params?.dataSourceKey || !params?.collectionName) {
        const coll = (this.context as any)?.collection;
        const dsKey = coll?.dataSourceKey;
        const collName = coll?.name;
        if (dsKey && collName) {
          this.setStepParams('resourceSettings', 'init', { dataSourceKey: dsKey, collectionName: collName });
        }
      }
    } catch (e) {
      // 忽略上下文读取失败
      void e;
    }
  }
  createResource(ctx: any, params: any) {
    // 配置表单不直接依赖数据读取，这里返回单记录资源占位，避免 BlockModel 抛错
    const resource = this.context.createResource(SingleRecordResource);
    // 行为与 CreateFormModel 一致：视为新记录，避免额外 GET
    (resource as any).isNewRecord = true;
    return resource;
  }
  renderComponent(): React.ReactNode {
    const { colon, labelAlign, labelWidth, labelWrap, layout } = this.props as any;
    return (
      <FormComponent model={this} layoutProps={{ colon, labelAlign, labelWidth, labelWrap, layout }}>
        <FlowModelRenderer model={(this.subModels as any).grid} showFlowSettings={false} />
      </FormComponent>
    );
  }

  setInitialAssignedValues(map: Record<string, any> | undefined) {
    const grid = (this.subModels as any)?.grid as any;
    if (!grid || typeof grid.addOrEnsureItem !== 'function') return;
    Object.entries(map || {}).forEach(([fieldName, value]) => {
      grid.addOrEnsureItem(fieldName, value);
    });
  }

  getAssignedValues(): Record<string, any> {
    const grid = (this.subModels as any)?.grid as any;
    if (!grid || typeof grid.getAssignedValues !== 'function') return {};
    return grid.getAssignedValues();
  }
}

AssignFieldsFormModel.define({
  label: escapeT('Field assignments'),
  createModelOptions: {
    use: 'AssignFieldsFormModel',
    subModels: {
      grid: { use: 'AssignFieldGridModel' },
    },
  },
});
