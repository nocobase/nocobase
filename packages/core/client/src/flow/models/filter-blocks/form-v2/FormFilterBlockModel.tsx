/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm } from '@formily/core';
import { FilterBlockModel } from '../../base/BlockModel';
import React from 'react';
import { FormProvider } from '@formily/react';
import { FormButtonGroup, FormLayout } from '@formily/antd-v5';
import {
  AddActionButton,
  buildActionItems,
  DndProvider,
  DragHandler,
  Droppable,
  FlowModelRenderer,
} from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';

export class FormFilterBlockModel extends FilterBlockModel<{
  subModels: {
    grid: any; // Replace with actual type if available
    actions?: any[]; // Replace with actual type if available
  };
}> {
  get form() {
    return this.context.form;
  }

  addAppends() {}

  onInit(options) {
    super.onInit(options);
    this.context.defineProperty('form', {
      get: () => createForm(),
    });
    this.context.defineProperty('blockModel', {
      value: this,
    });
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
            <AddActionButton model={this} items={buildActionItems(this, 'FilterFormActionModel')} />
          </FormButtonGroup>
        </DndProvider>
      </FormProvider>
    );
  }
}

FormFilterBlockModel.define({
  title: tval('Form'),
  requiresDataSource: false,
  defaultOptions: {
    use: 'FormFilterBlockModel',
    subModels: {
      grid: {
        use: 'FilterFormFieldGridModel',
      },
    },
  },
});
