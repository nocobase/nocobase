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
  Collection,
  FlowModelRenderer,
  buildActionItems,
  buildFieldItems,
} from '@nocobase/flow-engine';
import { Card } from 'antd';
import React from 'react';
import { tval } from '@nocobase/utils/client';
import { FilterBlockModel } from '../../base/BlockModel';
import { FilterFormFieldModel } from './FilterFormFieldModel';

export class FilterFormModel extends FilterBlockModel {
  form: Form;
  collection: Collection;

  render() {
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
      <Card>
        <FormProvider form={this.form}>
          <FormLayout layout={'vertical'}>
            {this.mapSubModels('fields', (field) => (
              <FlowModelRenderer model={field} showFlowSettings={{ showBorder: false }} />
            ))}
          </FormLayout>
          <AddFieldButton items={fieldItems} subModelKey="fields" model={this} />
          <FormButtonGroup>
            {this.mapSubModels('actions', (action) => (
              <FlowModelRenderer model={action} showFlowSettings={{ showBorder: false }} />
            ))}
            <AddActionButton model={this} items={buildActionItems(this, 'FilterFormActionModel')} />
          </FormButtonGroup>
        </FormProvider>
      </Card>
    );
  }
}

FilterFormModel.define({
  hide: true,
  title: tval('Form'),
});

FilterFormModel.registerFlow({
  key: 'default',
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
        ctx.model.form = ctx.inputArgs.form || createForm();
        if (!ctx.model.collection) {
          ctx.model.collection = ctx.dataSourceManager.getCollection(params.dataSourceKey, params.collectionName);
        }
      },
    },
  },
});
