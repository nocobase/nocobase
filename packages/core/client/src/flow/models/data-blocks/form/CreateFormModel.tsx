/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  AddActionButton,
  buildActionItems,
  DndProvider,
  DragHandler,
  Droppable,
  escapeT,
  FlowModelRenderer,
  SingleRecordResource,
} from '@nocobase/flow-engine';
import { FormModel, FormComponent } from './FormModel';
import { FormLayout, FormButtonGroup } from '@formily/antd-v5';
import { FormProvider } from '@formily/react';
import React from 'react';

// CreateFormModel - 专门用于新增记录
export class CreateFormModel extends FormModel {
  createResource() {
    const resource = new SingleRecordResource();
    resource.isNewRecord = true; // 明确标记为新记录
    return resource;
  }

  renderComponent() {
    const { colon, labelAlign, labelWidth, labelWrap, layout } = this.props;
    return (
      <FormComponent model={this}>
        <FlowModelRenderer model={this.subModels.grid} showFlowSettings={false} />
        <DndProvider>
          <FormButtonGroup>
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
            <AddActionButton model={this} items={buildActionItems(this, 'FormActionModel')} />
          </FormButtonGroup>
        </DndProvider>
        {/* <FormProvider form={this.form}> */}
        {/* <FormLayout
            colon={colon}
            labelAlign={labelAlign}
            labelWidth={labelWidth}
            labelWrap={labelWrap}
            layout={layout}
          >
          </FormLayout>
         
        </FormProvider> */}
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
    refresh: {
      async handler(ctx) {
        await ctx.model.applySubModelsAutoFlows('grid');
      },
    },
  },
});

CreateFormModel.define({
  title: escapeT('Form (Add new)'),
  defaultOptions: {
    use: 'CreateFormModel',
    subModels: {
      grid: {
        use: 'FormFieldGridModel',
      },
    },
  },
  sort: 350,
});
