/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined } from '@ant-design/icons';
import {
  AddSubModelButton,
  DndProvider,
  DragHandler,
  Droppable,
  escapeT,
  FlowModelRenderer,
  FlowSettingsButton,
  SingleRecordResource,
} from '@nocobase/flow-engine';
import { Space } from 'antd';
import React from 'react';
import { FormActionModel } from './FormActionModel';
import { FormComponent, FormModel } from './FormModel';

// CreateFormModel - 专门用于新增记录
export class CreateFormModel extends FormModel {
  static type = 'toNew';

  createResource(ctx, params) {
    const resource = new SingleRecordResource();
    resource.isNewRecord = true; // 明确标记为新记录
    return resource;
  }
  getAclActionName() {
    return 'create';
  }

  renderComponent() {
    const { colon, labelAlign, labelWidth, labelWrap, layout } = this.props;
    return (
      <FormComponent model={this} layoutProps={{ colon, labelAlign, labelWidth, labelWrap, layout }}>
        <FlowModelRenderer model={this.subModels.grid} showFlowSettings={false} />
        <DndProvider>
          <Space>
            {this.mapSubModels('actions', (action) => (
              <Droppable model={action} key={action.uid}>
                <FlowModelRenderer
                  key={action.uid}
                  model={action}
                  showFlowSettings={{ showBackground: false, showBorder: false }}
                  extraToolbarItems={[
                    {
                      key: 'drag-handler',
                      component: DragHandler,
                      sort: 1,
                    },
                  ]}
                />
              </Droppable>
            ))}
            <AddSubModelButton model={this} subModelKey="actions" subModelBaseClass={FormActionModel}>
              <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Actions')}</FlowSettingsButton>
            </AddSubModelButton>
          </Space>
        </DndProvider>
      </FormComponent>
    );
  }
}

CreateFormModel.registerFlow({
  key: 'formSettings',
  title: escapeT('Form settings'),
  steps: {
    init: {
      async handler(ctx) {
        if (!ctx.resource) {
          throw new Error('Resource is not initialized');
        }
        if (ctx.model.form) {
          return;
        }
        // 新增表单不需要监听refresh事件，因为没有现有数据
      },
    },
    refresh: {},
  },
});

CreateFormModel.define({
  label: escapeT('Form (Add new)'),
  searchable: true,
  searchPlaceholder: escapeT('Search collections'),
  createModelOptions: {
    use: 'CreateFormModel',
    subModels: {
      grid: {
        use: 'FormFieldGridModel',
      },
    },
  },
  sort: 350,
});
