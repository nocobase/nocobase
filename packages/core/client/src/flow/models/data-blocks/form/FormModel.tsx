/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormButtonGroup, FormLayout } from '@formily/antd-v5';
import { createForm, Form } from '@formily/core';
import { FormProvider } from '@formily/react';
import {
  AddActionButton,
  buildActionItems,
  DndProvider,
  DragHandler,
  Droppable,
  FlowModelRenderer,
  SingleRecordResource,
} from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import React from 'react';
import { DataBlockModel } from '../../base/BlockModel';
import { BlockGridModel } from '../../base/GridModel';
import { FormFieldGridModel } from './FormFieldGridModel';
import { FormActionModel } from './FormActionModel';

export class FormModel extends DataBlockModel<{
  parent?: BlockGridModel;
  subModels?: { grid: FormFieldGridModel; actions?: FormActionModel[] };
}> {
  form: Form;
  declare resource: SingleRecordResource;

  createResource(ctx, params) {
    return new SingleRecordResource();
  }

  renderComponent() {
    return (
      <FormProvider form={this.form}>
        <FormLayout layout={'vertical'}>
          <FlowModelRenderer model={this.subModels.grid} showFlowSettings={false} />
        </FormLayout>
        <DndProvider>
          <FormButtonGroup>
            {this.mapSubModels('actions', (action) => (
              <Droppable model={action} key={action.uid}>
                <FlowModelRenderer
                  key={action.uid}
                  model={action}
                  showFlowSettings={{ showBackground: false, showBorder: false }}
                  sharedContext={{ currentRecord: this.resource.getData() }}
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
      </FormProvider>
    );
  }
}

FormModel.registerFlow({
  key: 'resourceSettings2',
  auto: true,
  title: tval('Resource settings'),
  steps: {
    initForm: {
      async handler(ctx, params) {
        if (ctx.model.form) {
          return;
        }
        ctx.model.form = createForm();
        ctx.model.resource.on('refresh', () => {
          ctx.model.form.setValues(ctx.model.resource.getData());
        });
      },
    },
    refresh: {
      async handler(ctx, params) {
        if (!ctx.model.resource) {
          throw new Error('Resource is not initialized');
        }
        if (ctx.model.resource.getFilterByTk()) {
          await ctx.model.resource.refresh();
        }
      },
    },
  },
});

FormModel.define({
  title: tval('Form'),
  group: 'Content',
  defaultOptions: {
    use: 'FormModel',
    subModels: {
      grid: {
        use: 'FormFieldGridModel',
      },
    },
  },
});
