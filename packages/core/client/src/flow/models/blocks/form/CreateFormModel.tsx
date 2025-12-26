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
import { submitHandler } from './submitHandler';

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

  async submit(params: any = {}) {
    await submitHandler(this.context, params);
  }

  renderComponent() {
    const { colon, labelAlign, labelWidth, labelWrap, layout } = this.props;
    const isConfigMode = !!this.context.flowSettingsEnabled;
    return (
      <FormComponent model={this} layoutProps={{ colon, labelAlign, labelWidth, labelWrap, layout }}>
        <FlowModelRenderer model={this.subModels.grid} showFlowSettings={false} />
        <DndProvider>
          <Space wrap>
            {this.mapSubModels('actions', (action) => {
              if (action.hidden && !isConfigMode) {
                return;
              }
              return (
                <Droppable model={action} key={action.uid}>
                  <MemoFlowModelRenderer
                    key={action.uid}
                    model={action}
                    showFlowSettings={this.context.flowSettingsEnabled ? this.actionFlowSettings : false}
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
