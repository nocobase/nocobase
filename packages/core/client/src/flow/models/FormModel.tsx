/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormButtonGroup, FormDialog, FormLayout, Submit } from '@formily/antd-v5';
import { createForm, Form } from '@formily/core';
import { FormProvider } from '@formily/react';
import {
  AddActionButton,
  AddFieldButton,
  AddFieldButtonProps,
  Collection,
  FlowEngineProvider,
  FlowModelRenderer,
  SingleRecordResource,
} from '@nocobase/flow-engine';
import { Card } from 'antd';
import React from 'react';
import { ActionModel } from './ActionModel';
import { BlockFlowModel } from './BlockFlowModel';
import { FormFieldModel } from './FormFieldModel';

export class FormModel extends BlockFlowModel {
  form: Form;
  resource: SingleRecordResource;
  collection: Collection;

  render() {
    const buildColumnSubModelParams: AddFieldButtonProps['buildSubModelParams'] = (item) => {
      return {
        use: 'FormFieldModel',
        stepParams: {
          default: {
            step1: {
              fieldPath: `${item.field.collection.dataSource.name}.${item.field.collection.name}.${item.field.name}`,
            },
          },
        },
      };
    };
    return (
      <Card>
        <FormProvider form={this.form}>
          <FormLayout layout={'vertical'}>
            {this.mapSubModels('fields', (field) => (
              <FlowModelRenderer model={field} showFlowSettings />
            ))}
          </FormLayout>
          <AddFieldButton
            buildSubModelParams={buildColumnSubModelParams}
            onModelAdded={async (fieldModel: FormFieldModel, item) => {
              fieldModel.collectionField = item.field;
            }}
            subModelKey="fields"
            model={this}
            collection={this.collection}
            ParentModelClass={FormFieldModel}
          />
          <FormButtonGroup>
            {this.mapSubModels('actions', (action) => (
              <FlowModelRenderer model={action} />
            ))}
            <AddActionButton model={this} ParentModelClass={ActionModel} />
          </FormButtonGroup>
        </FormProvider>
      </Card>
    );
  }
}

FormModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
    step1: {
      paramsRequired: true,
      hideInSettings: true,
      uiSchema: {
        dataSourceKey: {
          type: 'string',
          title: 'Data Source Key',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: 'Enter data source key',
          },
        },
        collectionName: {
          type: 'string',
          title: 'Collection Name',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: 'Enter collection name',
          },
        },
      },
      defaultParams: {
        dataSourceKey: 'main',
      },
      async handler(ctx, params) {
        ctx.model.form = ctx.extra.form || createForm();
        if (ctx.model.collection) {
          return;
        }
        ctx.model.collection = ctx.globals.dataSourceManager.getCollection(params.dataSourceKey, params.collectionName);
        const resource = new SingleRecordResource();
        resource.setDataSourceKey(params.dataSourceKey);
        resource.setResourceName(params.collectionName);
        resource.setAPIClient(ctx.globals.api);
        ctx.model.resource = resource;
        if (ctx.extra.filterByTk) {
          resource.setFilterByTk(ctx.extra.filterByTk);
          await resource.refresh();
          ctx.model.form.setInitialValues(resource.getData());
        }
      },
    },
  },
});

FormModel.define({
  title: 'Form',
  group: 'Content',
  defaultOptions: {
    use: 'FormModel',
  },
});
