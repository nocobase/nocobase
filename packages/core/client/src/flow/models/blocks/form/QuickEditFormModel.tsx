/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { PropertyMetaFactory } from '@nocobase/flow-engine';
import {
  BaseRecordResource,
  Collection,
  CollectionField,
  FieldModelRenderer,
  FlowEngine,
  FlowModel,
  FlowModelRenderer,
  FormItem,
  SingleRecordResource,
  createCurrentRecordMetaFactory,
  createRecordResolveOnServerWithLocal,
} from '@nocobase/flow-engine';
import { Button, Form, Skeleton, Space } from 'antd';
import _ from 'lodash';
import React from 'react';
import { FieldModel } from '../../base';
import { FormComponent } from './FormBlockModel';
import { FormItemModel } from './FormItemModel';

export class QuickEditFormModel extends FlowModel {
  fieldPath: string;

  declare resource: SingleRecordResource;
  declare collection: Collection;

  now: number = Date.now();

  viewContainer: any;
  __onSubmitSuccess;
  _fieldProps: any;
  _onOk: any;

  get form() {
    return this.context.form;
  }

  useHooksBeforeRender() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [form] = Form.useForm();
    this.context.defineProperty('form', { get: () => form });
  }

  static async open(options: {
    flowEngine: FlowEngine;
    target: any;
    dataSourceKey: string;
    collectionName: string;
    fieldPath: string;
    record: any;
    filterByTk?: string;
    onSuccess?: (values: any) => void;
    fieldProps?: any;
    sourceFieldModelUid?: string;
    onOk?: (values: any) => void;
  }) {
    const {
      flowEngine,
      target,
      dataSourceKey,
      collectionName,
      fieldPath,
      filterByTk,
      record,
      onSuccess,
      fieldProps,
      onOk,
      sourceFieldModelUid,
    } = options;
    const model = flowEngine.createModel({
      use: 'QuickEditFormModel',
      stepParams: {
        quickEditFormSettings: {
          init: {
            dataSourceKey,
            collectionName,
            fieldPath,
          },
        },
      },
    }) as QuickEditFormModel;

    console.log('QuickEditFormModel.open2', Date.now() - model.now);
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
        model._fieldProps = fieldProps;
        model._onOk = onOk;
        console.log('QuickEditFormModel.open3', Date.now() - model.now);
        return (
          <FlowModelRenderer
            fallback={<Skeleton.Input size="small" />}
            model={model}
            inputArgs={{ filterByTk, record, sourceFieldModelUid }}
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
    const recordMeta: PropertyMetaFactory = createCurrentRecordMetaFactory(this.context, () => this.collection);
    this.context.defineProperty('record', {
      get: () => this.resource.getData(),
      cache: false,
      resolveOnServer: createRecordResolveOnServerWithLocal(
        () => this.collection,
        () => this.resource.getData(),
      ),
      meta: recordMeta,
    });
    this.context.defineProperty('collection', {
      get: () => this.collection,
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
    console.log('QuickEditFormModel.open4', Date.now() - this.now);

    return (
      <FormComponent model={this}>
        {this.mapSubModels('fields', (field) => {
          return (
            <FormItem
              showLabel={false}
              name={this.fieldPath}
              key={field.uid}
              initialValue={this.context.record?.[this.fieldPath]}
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
              if (this._onOk) {
                this._onOk(formValues);
                this.viewContainer.close();
              } else {
                try {
                  await this.resource.save(formValues, { refresh: false });
                  this.__onSubmitSuccess?.(formValues);
                  this.viewContainer.close();
                  this.context.message.success(this.context.t('Saved successfully'));
                } catch (error) {
                  console.error('Failed to save form data:', error);
                  this.context.message.error(this.context.t('Failed to save form data'));
                  this.__onSubmitSuccess?.(originalValues);
                }
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

QuickEditFormModel.registerFlow({
  key: 'quickEditFormSettings',
  sort: 100,
  steps: {
    init: {
      async handler(ctx, params) {
        const { dataSourceKey, collectionName, fieldPath } = params;
        if (!dataSourceKey || !collectionName || !fieldPath) {
          throw new Error('dataSourceKey, collectionName and fieldPath are required parameters');
        }
        ctx.model.fieldPath = fieldPath;
        ctx.model.collection = ctx.dataSourceManager.getCollection(dataSourceKey, collectionName);
        const resource = ctx.createResource(SingleRecordResource);
        resource.setDataSourceKey(dataSourceKey);
        resource.setResourceName(collectionName);
        ctx.model.resource = resource;
        const collectionField = ctx.model.collection.getField(fieldPath) as CollectionField;
        if (collectionField) {
          const binding = FormItemModel.getDefaultBindingByField(ctx, collectionField);
          if (!binding) {
            return;
          }
          const use = binding.modelName;
          const fieldModel = ctx.model.addSubModel<FieldModel>('fields', {
            use,
            props:
              typeof binding.defaultProps === 'function'
                ? binding.defaultProps(ctx, collectionField)
                : binding.defaultProps,
            stepParams: {
              fieldSettings: {
                init: {
                  dataSourceKey,
                  collectionName,
                  fieldPath,
                },
              },
            },
          });
          fieldModel.setProps({ ...collectionField.getComponentProps(), ...ctx.model._fieldProps });
          fieldModel.setProps({ sourceFieldModelUid: ctx.inputArgs.sourceFieldModelUid });
          ctx.model.context.defineProperty('collectionField', {
            get: () => collectionField,
          });
          ctx.model.addAppends(fieldPath);
          await fieldModel.dispatchEvent('beforeRender');
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

QuickEditFormModel.define({
  hide: true,
});
