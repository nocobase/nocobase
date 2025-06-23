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
import { AddActionButton, AddFieldButton, FlowModelRenderer, SingleRecordResource } from '@nocobase/flow-engine';
import { Card } from 'antd';
import dataSource from 'packages/core/client/docs/zh-CN/core/flow-models/demos/data-source';
import React from 'react';
import { DataBlockModel } from '../../base/BlockModel';
import { FormFieldModel } from './fields/FormFieldModel';

export class FormModel extends DataBlockModel {
  form: Form;
  declare resource: SingleRecordResource;

  render() {
    return (
      <Card>
        <FormProvider form={this.form}>
          <FormLayout layout={'vertical'}>
            {this.mapSubModels('fields', (field) => (
              <FlowModelRenderer
                model={field}
                showFlowSettings={{ showBorder: false }}
                // sharedContext={{ currentBlockModel: this }}
              />
            ))}
          </FormLayout>
          <AddFieldButton
            buildCreateModelOptions={({ defaultOptions, fieldPath }) => ({
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
            })}
            subModelKey="fields"
            model={this}
            collection={this.collection}
            subModelBaseClass="FormFieldModel"
          />
          <FormButtonGroup style={{ marginTop: 16 }}>
            {this.mapSubModels('actions', (action) => (
              <FlowModelRenderer
                model={action}
                showFlowSettings={{ showBackground: false, showBorder: false }}
                // sharedContext={{ currentBlockModel: this }}
              />
            ))}
            <AddActionButton model={this} subModelBaseClass="FormActionModel" />
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
        if (!ctx.model.collection) {
          ctx.model.collection = ctx.globals.dataSourceManager.getCollection(
            params.dataSourceKey,
            params.collectionName,
          );
          const resource = new SingleRecordResource();
          resource.setDataSourceKey(params.dataSourceKey);
          resource.setResourceName(params.collectionName);
          resource.setAPIClient(ctx.globals.api);
          ctx.model.resource = resource;
        }
        await ctx.model.applySubModelsAutoFlows('fields');
        if (ctx.shared.parentRecord) {
          ctx.model.resource.setFilterByTk(ctx.shared.parentRecord.id);
          await ctx.model.resource.refresh();
          ctx.model.form.setInitialValues(ctx.model.resource.getData());
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
