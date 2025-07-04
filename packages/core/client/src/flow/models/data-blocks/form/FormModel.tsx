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
  AddFieldButton,
  FlowModelRenderer,
  SingleRecordResource,
  buildFieldItems,
  buildActionItems,
} from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import React from 'react';
import { DataBlockModel } from '../../base/BlockModel';
import { EditableFieldModel } from '../../fields/EditableField/EditableFieldModel';
import { FormCustomFormItemModel } from './FormCustomFormItemModel';

export class FormModel extends DataBlockModel {
  form: Form;
  declare resource: SingleRecordResource;

  renderComponent() {
    const fieldItems = buildFieldItems(
      this.collection.getFields(),
      this,
      'EditableFieldModel',
      'fields',
      ({ defaultOptions, fieldPath }) => ({
        use: defaultOptions.use,
        stepParams: {
          default: {
            step1: {
              dataSourceKey: this.collection.dataSourceKey,
              collectionName: this.collection.name,
              fieldPath,
            },
          },
        },
      }),
    );

    return (
      <FormProvider form={this.form}>
        <FormLayout layout={'vertical'}>
          {this.mapSubModels('fields', (field) => (
            <FlowModelRenderer
              key={field.uid}
              model={field}
              showFlowSettings={{ showBorder: false }}
              sharedContext={{ currentRecord: this.resource.getData() }}
            />
          ))}
        </FormLayout>
        <AddFieldButton
          items={fieldItems}
          subModelKey="fields"
          subModelBaseClass={FormCustomFormItemModel}
          model={this}
          onSubModelAdded={async (model: EditableFieldModel) => {
            const params = model.getStepParams('default', 'step1');
            this.addAppends(params?.fieldPath, !!this.ctx.shared?.currentFlow?.runtimeArgs?.filterByTk);
          }}
        />
        <FormButtonGroup style={{ marginTop: 16 }}>
          {this.mapSubModels('actions', (action) => (
            <FlowModelRenderer
              key={action.uid}
              model={action}
              showFlowSettings={{ showBackground: false, showBorder: false }}
              sharedContext={{ currentRecord: this.resource.getData() }}
            />
          ))}
          <AddActionButton model={this} items={buildActionItems(this, 'FormActionModel')} />
        </FormButtonGroup>
      </FormProvider>
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
          title: tval('Data Source Key'),
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: tval('Enter data source key'),
          },
        },
        collectionName: {
          type: 'string',
          title: tval('Collection Name'),
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: tval('Enter collection name'),
          },
        },
      },
      defaultParams: {
        dataSourceKey: 'main',
      },
      async handler(ctx, params) {
        ctx.model.form = ctx.runtimeArgs.form || createForm();
        if (!ctx.model.collection) {
          const {
            dataSourceKey = params.dataSourceKey, // 兼容一下旧的数据, TODO: remove
            collectionName = params.collectionName, // 兼容一下旧的数据, TODO: remove
            assocationName,
            sourceId,
            filterByTk,
          } = ctx.model.props.dataSourceOptions || {};

          ctx.model.collection = ctx.globals.dataSourceManager.getCollection(dataSourceKey, collectionName);
          const resource = new SingleRecordResource();
          resource.setDataSourceKey(dataSourceKey);
          resource.setResourceName(collectionName);
          resource.setAPIClient(ctx.globals.api);
          ctx.model.resource = resource;
          ctx.model.resource.on('refresh', () => {
            ctx.model.form.setInitialValues(ctx.model.resource.getData());
          });
          if (filterByTk) {
            ctx.model.resource.setFilterByTk(filterByTk);
            await ctx.model.resource.refresh();
            ctx.model.form.setInitialValues(ctx.model.resource.getData());
          }
        }
        await ctx.model.applySubModelsAutoFlows('fields');
      },
    },
  },
});

FormModel.define({
  title: tval('Form'),
  group: 'Content',
  defaultOptions: {
    use: 'FormModel',
  },
});
