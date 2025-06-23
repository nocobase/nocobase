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
import { AddActionButton, AddFieldButton, Collection, FlowModelRenderer } from '@nocobase/flow-engine';
import { Card } from 'antd';
import React from 'react';
import { FilterBlockModel } from '../../base/BlockModel';
import { FilterFormFieldModel } from './FilterFormFieldModel';

export class FilterFormModel extends FilterBlockModel {
  form: Form;
  collection: Collection;

  render() {
    return (
      <Card>
        <FormProvider form={this.form}>
          <FormLayout layout={'vertical'}>
            {this.mapSubModels('fields', (field) => (
              <FlowModelRenderer
                model={field}
                showFlowSettings={{ showBorder: false }}
                sharedContext={{ currentBlockModel: this }}
              />
            ))}
          </FormLayout>
          <AddFieldButton
            buildCreateModelOptions={(field, fieldClass) => ({
              use: fieldClass.name,
              stepParams: {
                default: {
                  step1: {
                    fieldPath: `${field.collection.dataSource.key}.${field.collection.name}.${field.name}`,
                  },
                },
              },
            })}
            onModelAdded={async (fieldModel: FilterFormFieldModel) => {
              const fieldInfo = fieldModel.stepParams?.field;
              if (fieldInfo && typeof fieldInfo.name === 'string') {
                // 如果需要设置 collectionField，可以从 collection 中获取
                const fields = this.collection.getFields();
                const field = fields.find((f) => f.name === fieldInfo.name);
                if (field) {
                  fieldModel.collectionField = field;
                }
              }
            }}
            subModelKey="fields"
            model={this}
            collection={this.collection}
            subModelBaseClass="FormFieldModel"
          />
          <FormButtonGroup>
            {this.mapSubModels('actions', (action) => (
              <FlowModelRenderer
                model={action}
                showFlowSettings={{ showBorder: false }}
                sharedContext={{ currentBlockModel: this }}
              />
            ))}
            <AddActionButton model={this} subModelBaseClass="FilterFormActionModel" />
          </FormButtonGroup>
        </FormProvider>
      </Card>
    );
  }
}

FilterFormModel.registerFlow({
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
        }
      },
    },
  },
});
