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
  BaseRecordResource,
  Collection,
  CollectionField,
  FlowEngine,
  FlowModel,
  FlowModelRenderer,
  SingleRecordResource,
} from '@nocobase/flow-engine';
import { Button, Skeleton } from 'antd';
import _ from 'lodash';
import React from 'react';
import { EditableFieldModel } from '../../fields/EditableField';

export class QuickEditForm extends FlowModel {
  fieldPath: string;

  declare resource: SingleRecordResource;
  declare collection: Collection;

  now: number = Date.now();

  viewContainer: any;
  __onSubmitSuccess;

  get form() {
    return this.context.form as Form;
  }

  static async open(options: {
    flowEngine: FlowEngine;
    target: any;
    dataSourceKey: string;
    collectionName: string;
    fieldPath: string;
    filterByTk: string;
    record: any;
    onSuccess?: (values: any) => void;
    fieldProps?: any;
  }) {
    // this.now = Date.now();
    const { flowEngine, target, dataSourceKey, collectionName, fieldPath, filterByTk, record, onSuccess, fieldProps } =
      options;
    const model = flowEngine.createModel({
      use: 'QuickEditForm',
      stepParams: {
        quickEditFormSettings: {
          init: {
            dataSourceKey,
            collectionName,
            fieldPath,
            fieldProps,
          },
        },
      },
    }) as QuickEditForm;

    console.log('QuickEditForm.open2', Date.now() - model.now);
    model.now = Date.now();

    await flowEngine.context.viewOpener.open({
      mode: 'popover',
      target,
      placement: 'rightTop',
      styles: {
        body: {
          maxWidth: 400,
        },
      },
      content: (popover) => {
        model.viewContainer = popover;
        model.__onSubmitSuccess = onSuccess;
        console.log('QuickEditForm.open3', Date.now() - model.now);
        return (
          <FlowModelRenderer
            fallback={<Skeleton.Input size="small" />}
            model={model}
            inputArgs={{ filterByTk, record }}
          />
        );
      },
    });
  }

  onInit(options) {
    super.onInit(options);
    this.context.defineProperty('blockModel', {
      value: this,
    });
    this.context.defineProperty('form', {
      get: () => createForm(),
    });
    this.context.defineProperty('record', {
      get: () => this.resource.getData(),
    });
  }

  addAppends(fieldPath: string, refresh = false) {
    const field = this.context.dataSourceManager.getCollectionField(
      `${this.collection.dataSourceKey}.${this.collection.name}.${fieldPath}`,
    ) as CollectionField;
    if (!field) {
      return;
    }
    if (!field.isAssociationField()) {
      return;
    }
    (this.resource as BaseRecordResource).addAppends(fieldPath);
    if (refresh) {
      this.resource.refresh();
    }
  }

  render() {
    console.log('QuickEditForm.open4', Date.now() - this.now);

    return (
      <form
        style={{ minWidth: '200px' }}
        className="quick-edit-form"
        onSubmit={async (e) => {
          e.preventDefault();
          await this.form.submit();
          const formValues = {
            [this.fieldPath]: this.form.values[this.fieldPath],
          };
          const originalValues = {
            [this.fieldPath]: this.resource.getData()?.[this.fieldPath],
          };
          try {
            this.resource.save(formValues, { refresh: false }).catch((error) => {});
            this.__onSubmitSuccess?.(formValues);
            this.viewContainer.close();
          } catch (error) {
            console.error('Failed to save form data:', error);
            this.context.message.error(this.context.t('Failed to save form data'));
            this.__onSubmitSuccess?.(originalValues);
          }
        }}
      >
        <FormProvider form={this.form}>
          <FormLayout layout={'vertical'}>
            {this.mapSubModels('fields', (field) => {
              return <FlowModelRenderer key={field.uid} model={field} fallback={<Skeleton.Input size="small" />} />;
            })}
          </FormLayout>
          <FormButtonGroup align="right">
            <Button
              onClick={() => {
                this.viewContainer.close();
              }}
            >
              {this.context.t('Cancel')}
            </Button>
            <Button type="primary" htmlType="submit">
              {this.context.t('Submit')}
            </Button>
          </FormButtonGroup>
        </FormProvider>
      </form>
    );
  }
}

QuickEditForm.registerFlow({
  key: 'quickEditFormSettings',
  auto: true,
  sort: 100,
  steps: {
    init: {
      async handler(ctx, params) {
        const { dataSourceKey, collectionName, fieldPath, fieldProps } = params;
        if (!dataSourceKey || !collectionName || !fieldPath) {
          throw new Error('dataSourceKey, collectionName and fieldPath are required parameters');
        }
        ctx.model.fieldPath = fieldPath;
        ctx.model.collection = ctx.dataSourceManager.getCollection(dataSourceKey, collectionName);
        const resource = new SingleRecordResource();
        resource.setDataSourceKey(dataSourceKey);
        resource.setResourceName(collectionName);
        resource.setAPIClient(ctx.api);
        ctx.model.resource = resource;
        const collectionField = ctx.model.collection.getField(fieldPath) as CollectionField;
        if (collectionField) {
          const use = collectionField.getFirstSubclassNameOf('EditableFieldModel') || 'EditableFieldModel';
          const fieldModel = ctx.model.addSubModel<EditableFieldModel>('fields', {
            use,
            stepParams: {
              fieldSettings: {
                init: {
                  dataSourceKey,
                  collectionName,
                  fieldPath,
                },
              },
              formItemSettings: {
                createField: {
                  fieldProps,
                },
              },
            },
          });
          await fieldModel.applyAutoFlows();
          ctx.model.addAppends(fieldPath);
        }
        if (ctx.inputArgs.filterByTk || ctx.inputArgs.record) {
          resource.setFilterByTk(ctx.inputArgs.filterByTk);
          resource.setData(ctx.inputArgs.record);
          ctx.model.form.setValues(resource.getData());
        }
      },
    },
  },
});

QuickEditForm.define({
  hide: true,
});
