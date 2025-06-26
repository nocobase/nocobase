/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormButtonGroup, FormLayout, Submit } from '@formily/antd-v5';
import { createForm, Form } from '@formily/core';
import { FormProvider } from '@formily/react';
import {
  BaseRecordResource,
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

  onInit() {
    this.setSharedContext({
      currentBlockModel: this,
    });
  }

  addAppends(fieldPath: string, refresh = false) {
    const field = this.ctx.globals.dataSourceManager.getCollectionField(
      `${this.collection.dataSourceKey}.${this.collection.name}.${fieldPath}`,
    );
    if (!field) {
      throw new Error(
        `Collection field not found: ${this.collection.dataSourceKey}.${this.collection.name}.${fieldPath}`,
      );
    }
    if (['belongsToMany', 'belongsTo', 'hasMany', 'hasOne'].includes(field.type)) {
      (this.resource as BaseRecordResource).addAppends(field.name);
      if (refresh) {
        this.resource.refresh();
      }
    }
  }

  static async open(options: {
    target: any;
    flowEngine: FlowEngine;
    dataSourceKey: string;
    collectionName: string;
    fieldPath: string;
    filterByTk: string;
  }) {
    const { flowEngine, dataSourceKey, collectionName, fieldPath, target, filterByTk } = options;
    const model = flowEngine.createModel({
      use: 'QuickEditForm',
      stepParams: {
        initial: {
          step1: {
            dataSourceKey,
            collectionName,
            fieldPath,
          },
        },
      },
    }) as QuickEditForm;
    await model.open({ target, filterByTk });
    options.flowEngine.removeModel(model.uid);
  }

  async open({ target, filterByTk }: { target: any; filterByTk: string }) {
    await this.applyFlow('initial', { filterByTk });
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
                  {this.mapSubModels('fields', (field) => {
                    return <FlowModelRenderer model={field} fallback={<Skeleton paragraph={{ rows: 2 }} />} />;
                  })}
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
      async handler(ctx, params) {
        const { dataSourceKey, collectionName, fieldPath } = params;
        if (!dataSourceKey || !collectionName || !fieldPath) {
          throw new Error('dataSourceKey, collectionName and fieldPath are required parameters');
        }
        ctx.model.collection = ctx.globals.dataSourceManager.getCollection(dataSourceKey, collectionName);
        ctx.model.form = createForm();
        const resource = new SingleRecordResource();
        resource.setDataSourceKey(dataSourceKey);
        resource.setResourceName(collectionName);
        resource.setAPIClient(ctx.globals.api);
        ctx.model.resource = resource;
        if (ctx.extra.filterByTk) {
          resource.setFilterByTk(ctx.extra.filterByTk);
          await resource.refresh();
          ctx.model.form.setInitialValues(resource.getData());
        }
        const collectionField = ctx.model.collection.getField(fieldPath) as CollectionField;
        if (collectionField) {
          let use = 'EditableFieldModel';
          if (collectionField.interface === 'number') {
            use = 'InputNumberFieldModel';
          }
          if (collectionField.interface === 'integer') {
            use = 'InputNumberFieldModel';
          }
          if (collectionField.interface === 'select') {
            use = 'SelectFieldModel';
          }
          if (collectionField.interface === 'textarea') {
            use = 'TextareaFieldModel';
          }
          if (collectionField.interface === 'datetime') {
            use = 'DateTimeFieldModel';
          }
          ctx.model.addSubModel('fields', {
            use,
            stepParams: {
              default: {
                step1: {
                  dataSourceKey,
                  collectionName,
                  fieldPath,
                },
              },
            },
          });
        }
      },
    },
  },
});
