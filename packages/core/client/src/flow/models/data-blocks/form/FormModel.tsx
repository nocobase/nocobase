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
  buildActionItems,
  buildFieldItems,
  FlowModelRenderer,
  SingleRecordResource,
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
          fieldSettings: {
            init: {
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
  key: 'resourceSettings2',
  auto: true,
  title: tval('Resource settings'),
  steps: {
    init: {
      paramsRequired: true,
      hideInSettings: true,
      defaultParams: {
        dataSourceKey: 'main',
      },
      async handler(ctx, params) {
        ctx.model.form = ctx.model.form || createForm();
        const {
          dataSourceKey = params.dataSourceKey, // 兼容一下旧的数据, TODO: remove
          collectionName = params.collectionName, // 兼容一下旧的数据, TODO: remove
          associationName,
          sourceId,
          filterByTk,
        } = ctx.model.props.dataSourceOptions || {};
        if (!ctx.model.collection) {
          ctx.model.collection = ctx.globals.dataSourceManager.getCollection(
            dataSourceKey,
            associationName ? associationName.split('.').slice(-1)[0] : collectionName,
          );
        }

        if (!ctx.model.resource) {
          ctx.model.resource = new SingleRecordResource();
          ctx.model.resource.on('refresh', () => {
            ctx.model.form.setValues(ctx.model.resource.getData());
          });
        }

        ctx.model.resource.setDataSourceKey(dataSourceKey);
        ctx.model.resource.setResourceName(associationName || collectionName);
        ctx.model.resource.setSourceId(sourceId);
        ctx.model.resource.setAPIClient(ctx.globals.api);
        if (filterByTk) {
          ctx.model.resource.setFilterByTk(filterByTk);
          await ctx.model.resource.refresh();
        }
      },
    },
  },
});

FormModel.registerFlow({
  key: 'formSettings',
  auto: true,
  title: tval('Form settings'),
  steps: {
    init: {
      async handler(ctx, params) {
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
