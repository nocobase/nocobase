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
  Collection,
  CollectionField,
  FlowEngine,
  FlowEngineProvider,
  FlowModel,
  FlowModelRenderer,
  SingleRecordResource,
} from '@nocobase/flow-engine';
import React from 'react';

export class QuickEditForm extends FlowModel {
  form: Form;
  declare resource: SingleRecordResource;
  declare collection: Collection;

  static async open(options: { flowEngine: FlowEngine; collectionField: CollectionField; filterByTk: string }) {
    const model = options.flowEngine.createModel({
      use: 'QuickEditForm',
    }) as QuickEditForm;
    await model.open(options);
    options.flowEngine.removeModel(model.uid);
  }

  async open({ collectionField, filterByTk }: { filterByTk: string; collectionField: CollectionField }) {
    await this.applyFlow('initial', {
      dataSourceKey: collectionField.collection.dataSource.name,
      collectionName: collectionField.collection.name,
      filterByTk,
      fieldPath: collectionField.fullpath,
    });
    return new Promise((resolve) => {
      const dialog = FormDialog(
        {
          footer: null,
          title: 'Quick edit',
        },
        (form) => {
          return (
            <FlowEngineProvider engine={this.flowEngine}>
              <FormProvider form={this.form}>
                <FormLayout layout={'vertical'}>
                  {this.mapSubModels('fields', (field) => (
                    <FlowModelRenderer model={field} />
                  ))}
                </FormLayout>
                <FormButtonGroup>
                  <Submit
                    onClick={async () => {
                      await this.resource.save(this.form.values);
                      dialog.close();
                      resolve(this.form.values); // 在 close 之后 resolve
                    }}
                  >
                    Submit
                  </Submit>
                </FormButtonGroup>
              </FormProvider>
            </FlowEngineProvider>
          );
        },
      );
      dialog.open();
    });
  }
}

QuickEditForm.registerFlow({
  key: 'initial',
  steps: {
    step1: {
      async handler(ctx) {
        ctx.model.form = createForm();
        ctx.model.collection = ctx.globals.dataSourceManager.getCollection(
          ctx.extra.dataSourceKey,
          ctx.extra.collectionName,
        );
        const resource = new SingleRecordResource();
        resource.setDataSourceKey(ctx.extra.dataSourceKey);
        resource.setResourceName(ctx.extra.collectionName);
        resource.setAPIClient(ctx.globals.api);
        ctx.model.resource = resource;
        if (ctx.extra.filterByTk) {
          resource.setFilterByTk(ctx.extra.filterByTk);
          await resource.refresh();
          ctx.model.form.setInitialValues(resource.getData());
        }
        if (ctx.extra.fieldPath) {
          ctx.model.addSubModel('fields', {
            use: 'FormFieldModel',
            stepParams: {
              default: {
                step1: {
                  fieldPath: ctx.extra.fieldPath,
                },
              },
            },
          });
        }
      },
    },
  },
});
