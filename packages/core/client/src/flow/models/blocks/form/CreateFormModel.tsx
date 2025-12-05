/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  DndProvider,
  DragHandler,
  Droppable,
  tExpr,
  FlowModelRenderer,
  MemoFlowModelRenderer,
  SingleRecordResource,
} from '@nocobase/flow-engine';
import { Space } from 'antd';
import React from 'react';
import { BlockSceneEnum } from '../../base/BlockModel';
import { FormBlockModel, FormComponent } from './FormBlockModel';

// CreateFormModel - 专门用于新增记录
export class CreateFormModel extends FormBlockModel {
  static scene = BlockSceneEnum.new;

  private actionFlowSettings = { showBackground: false, showBorder: false, toolbarPosition: 'above' as const };
  private actionExtraToolbarItems = [
    {
      key: 'drag-handler',
      component: DragHandler,
      sort: 1,
    },
  ];

  createResource(ctx, params) {
    const resource = this.context.createResource(SingleRecordResource);
    resource.isNewRecord = true; // 明确标记为新记录
    return resource;
  }

  getAclActionName() {
    return 'create';
  }

  renderComponent() {
    const { colon, labelAlign, labelWidth, labelWrap, layout } = this.props;
    const isConfigMode = !!this.flowEngine?.flowSettings?.enabled;
    return (
      <FormComponent model={this} layoutProps={{ colon, labelAlign, labelWidth, labelWrap, layout }}>
        <FlowModelRenderer model={this.subModels.grid} showFlowSettings={false} />
        <DndProvider>
          <Space>
            {this.mapSubModels('actions', (action) => {
              if (action.hidden && !isConfigMode) {
                return;
              }
              return (
                <Droppable model={action} key={action.uid}>
                  <MemoFlowModelRenderer
                    key={action.uid}
                    model={action}
                    showFlowSettings={this.flowEngine.flowSettings.enabled ? this.actionFlowSettings : false}
                    extraToolbarItems={this.actionExtraToolbarItems}
                  />
                </Droppable>
              );
            })}
            {this.renderConfigureActions()}
          </Space>
        </DndProvider>
      </FormComponent>
    );
  }
}

CreateFormModel.registerFlow({
  key: 'formSettings',
  title: tExpr('Form settings'),
  steps: {
    init: {
      async handler(ctx) {
        if (!ctx.resource) {
          throw new Error('Resource is not initialized');
        }
        if (ctx.view.inputArgs.filterByTk) {
          const resource = ctx.createResource(SingleRecordResource);
          resource.setResourceName(ctx.model.collection.name);
          resource.setFilterByTk(ctx.view.inputArgs.filterByTk);
          resource.isNewRecord = false;
          await resource.refresh();
          const parentRecord = await resource.getData();
          // //树表添加子节点
          if (parentRecord) {
            ctx.form.setFieldValue('parentId', ctx.view.inputArgs.filterByTk);
            ctx.form.setFieldValue('parent', parentRecord);
          }
        }
      },
    },
    refresh: {},
  },
});

CreateFormModel.define({
  label: tExpr('Form (Add new)'),
  searchable: true,
  searchPlaceholder: tExpr('Search'),
  createModelOptions: {
    use: 'CreateFormModel',
    subModels: {
      grid: {
        use: 'FormGridModel',
      },
    },
  },
  sort: 350,
});
