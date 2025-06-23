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
import { InputRef, Skeleton } from 'antd';
import React, { createRef } from 'react';

export class QuickEditForm extends FlowModel {
  form: Form;
  declare resource: SingleRecordResource;
  declare collection: Collection;

  static async open(options: {
    target: any;
    flowEngine: FlowEngine;
    collectionField: CollectionField;
    filterByTk: string;
  }) {
    const model = options.flowEngine.createModel({
      use: 'QuickEditForm',
    }) as QuickEditForm;
    await model.open(options);
    options.flowEngine.removeModel(model.uid);
  }

  async open({
    target,
    collectionField,
    filterByTk,
  }: {
    target: any;
    filterByTk: string;
    collectionField: CollectionField;
  }) {
    await this.applyFlow('initial', {
      dataSourceKey: collectionField.collection.dataSource.key,
      collectionName: collectionField.collection.name,
      filterByTk,
      collectionField,
      fieldPath: collectionField.fullpath,
    });

    return new Promise((resolve) => {
      const inputRef = createRef<InputRef>();
      const popover = this.ctx.globals.popover.open({
        target,
        content: (
          <form
            style={{ minWidth: '200px' }}
            className="quick-edit-form"
            onSubmit={async (e) => {
              e.preventDefault();
              await this.form.submit();
              await this.resource.save(this.form.values);
              popover.destroy();
              resolve(this.form.values);
            }}
          >
            <FlowEngineProvider engine={this.flowEngine}>
              <FormProvider form={this.form}>
                <FormLayout layout={'vertical'}>
                  {this.mapSubModels('fields', (field) => (
                    <FlowModelRenderer model={field} fallback={<Skeleton paragraph={{ rows: 2 }} />} />
                  ))}
                </FormLayout>
                <FormButtonGroup>
                  <Submit
                    htmlType="submit"
                    onClick={async () => {
                      await this.resource.save(this.form.values);
                      popover.destroy();
                      resolve(this.form.values); // 在 close 之后 resolve
                    }}
                  >
                    Submit
                  </Submit>
                </FormButtonGroup>
              </FormProvider>
            </FlowEngineProvider>
          </form>
        ),
        onRendered: () => {
          setTimeout(() => {
            // 聚焦 Popover 内第一个 input 或 textarea
            const el = document.querySelector(
              '.quick-edit-form input, .quick-edit-form textarea, .quick-edit-form select',
            ) as HTMLInputElement | HTMLTextAreaElement | null;
            el?.focus();
          }, 200);
          // inputRef.current.focus();
        },
        placement: 'rightTop',
      });
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
        if (ctx.extra.collectionField) {
          let use = 'FormFieldModel';
          if (ctx.extra.collectionField.interface === 'number') {
            use = 'InputNumberFieldModel';
          }
          if (ctx.extra.collectionField.interface === 'integer') {
            use = 'InputNumberFieldModel';
          }
          if (ctx.extra.collectionField.interface === 'select') {
            use = 'SelectFieldModel';
          }
          if (ctx.extra.collectionField.interface === 'textarea') {
            use = 'TextareaFieldModel';
          }
          if (ctx.extra.collectionField.interface === 'datetime') {
            use = 'DateTimeFieldModel';
          }
          ctx.model.addSubModel('fields', {
            use,
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
