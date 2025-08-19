/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  BaseRecordResource,
  Collection,
  CollectionField,
  FlowEngine,
  FlowModel,
  FlowModelRenderer,
  SingleRecordResource,
} from '@nocobase/flow-engine';
import { Button, Skeleton, Space } from 'antd';
import _ from 'lodash';
import React from 'react';
import { FormComponent } from './FormModel';
import { FormItem } from './FormItem/FormItem';
import { FieldModelRenderer } from '../../../common/FieldModelRenderer';
import { FormFieldModel } from '../../fields';

export class QuickEditForm extends FlowModel {
  fieldPath: string;

  declare resource: SingleRecordResource;
  declare collection: Collection;

  now: number = Date.now();

  viewContainer: any;
  __onSubmitSuccess;

  get form() {
    return this.context.form;
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

    await flowEngine.context.viewer.open({
      type: 'popover',
      target,
      placement: 'rightTop',
      styles: {
        body: {
          width: 400,
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
      <FormComponent model={this}>
        {this.mapSubModels('fields', (field) => {
          return (
            <FormItem
              name={this.fieldPath}
              key={field.uid}
              initialValue={this.context.record[this.fieldPath]}
              {...this.props}
            >
              <FieldModelRenderer model={field} fallback={<Skeleton.Input size="small" />} />
            </FormItem>
          );
        })}
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            onClick={() => {
              this.viewContainer.close();
            }}
          >
            {this.context.t('Cancel')}
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            onClick={async () => {
              const values = this.form.getFieldsValue();
              await this.form.submit();
              const formValues = {
                ...values,
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
            {this.context.t('Submit')}
          </Button>
        </Space>
      </FormComponent>
    );
  }
}

QuickEditForm.registerFlow({
  key: 'quickEditFormSettings',
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
          const use = collectionField.getFirstSubclassNameOf('FormFieldModel') || 'FormFieldModel';
          const fieldModel = ctx.model.addSubModel<FormFieldModel>('fields', {
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
          ctx.model.setProps(collectionField.getComponentProps());
        }
        if (ctx.inputArgs.filterByTk || ctx.inputArgs.record) {
          resource.setFilterByTk(ctx.inputArgs.filterByTk);
          resource.setData(ctx.inputArgs.record);
          ctx.model.form?.setFieldsValue(resource.getData());
        }
      },
    },
  },
});

QuickEditForm.define({
  hide: true,
});
