/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModelRenderer, SingleRecordResource, createCollectionContextMeta, escapeT } from '@nocobase/flow-engine';
import React from 'react';
import { FormBlockModel, FormComponent } from '../form/FormBlockModel';
import { FilterManager } from '../filter-manager/FilterManager';

/**
 * 赋值配置表单
 */
// 使用范型标注 subModels.grid 的类型，提升类型提示与可读性
export class AssignFormModel extends FormBlockModel<{ subModels: { grid: any } }> {
  onInit(options: any) {
    super.onInit(options);
    // 该模型常在“配置面板”场景独立使用，不一定挂在 BlockGridModel 下，
    // 因此需要在本地补齐 filterManager，避免基础刷新流访问时出现空指针。
    this.context.defineProperty('filterManager', {
      once: true,
      get: () => new FilterManager(this, options?.filterManager),
    });
    // 配置表单不需要在挂载时触发资源刷新，避免无意义的网络交互
    this.isManualRefresh = true;
  }
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

AssignFormModel.define({
  label: escapeT('Field assignments'),
  hide: true,
  createModelOptions: {
    use: 'AssignFormModel',
    subModels: {
      grid: { use: 'AssignFormGridModel' },
    },
  },
});
