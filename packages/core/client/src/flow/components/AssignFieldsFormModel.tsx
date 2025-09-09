/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FlowModelRenderer, SingleRecordResource, escapeT } from '@nocobase/flow-engine';
import { FormComponent, FormModel } from '../models/blocks/form/FormModel';
import { FormGridModel } from '../models/blocks/form/FormGridModel';
import { AssignFieldGridModel } from './AssignFieldGridModel';

/**
 * 赋值配置表单
 */
// 使用范型标注 subModels.grid 的类型，提升类型提示与可读性
export class AssignFieldsFormModel extends FormModel<{ subModels: { grid: any } }> {
  createResource(ctx: any, params: any) {
    const resource = this.context.createResource(SingleRecordResource);
    // 行为与 CreateFormModel 一致：视为新记录，避免额外 GET
    resource.isNewRecord = true;
    return resource;
  }
  renderComponent(): React.ReactNode {
    const { colon, labelAlign, labelWidth, labelWrap, layout } = this.props as any;
    return (
      <FormComponent model={this} layoutProps={{ colon, labelAlign, labelWidth, labelWrap, layout }}>
        <FlowModelRenderer model={this.subModels?.grid} showFlowSettings={false} />
      </FormComponent>
    );
  }

  setInitialAssignedValues(map: Record<string, any> | undefined) {
    const grid = this.subModels?.grid;
    Object.entries(map || {}).forEach(([fieldName, value]) => {
      grid.addOrEnsureItem(fieldName, value);
    });
  }

  getAssignedValues(): Record<string, any> {
    return this.subModels.grid.getAssignedValues() || {};
  }
}

AssignFieldsFormModel.define({
  label: escapeT('Field assignments'),
  hide: true,
  createModelOptions: {
    use: 'AssignFieldsFormModel',
    subModels: {
      grid: { use: 'AssignFieldGridModel' },
    },
  },
});
