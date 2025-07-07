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
import { FormProvider, observer } from '@formily/react';
import {
  Collection,
  CollectionField,
  FlowEngine,
  FlowModelRenderer,
  SingleRecordResource,
} from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Button, Skeleton } from 'antd';
import _ from 'lodash';
import React from 'react';
import { DataBlockModel } from '../../base/BlockModel';

export class QuickEditForm extends DataBlockModel {
  form: Form;
  fieldPath: string;

  declare resource: SingleRecordResource;
  declare collection: Collection;

  now: number = Date.now();

  static async open(options: {
    flowEngine: FlowEngine;
    target: any;
    dataSourceKey: string;
    collectionName: string;
    fieldPath: string;
    filterByTk: string;
    record: any;
    onSuccess?: (values: any) => void;
  }) {
    // this.now = Date.now();
    const { flowEngine, target, dataSourceKey, collectionName, fieldPath, filterByTk, record, onSuccess } = options;
    const model = flowEngine.createModel({
      use: 'QuickEditForm',
      stepParams: {
        quickEditFormSettings: {
          init: {
            dataSourceKey,
            collectionName,
            fieldPath,
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
      content: (popover) => {
        console.log('QuickEditForm.open3', Date.now() - model.now);
        return (
          <FlowModelRenderer
            sharedContext={{
              currentView: popover,
              __onSubmitSuccess: onSuccess,
            }}
            fallback={<Skeleton.Input size="small" />}
            model={model}
            runtimeArgs={{ filterByTk, record }}
          />
        );
      },
    });
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

          this.resource.save(formValues, { refresh: false }).catch((error) => {
            console.error('Failed to save form data:', error);
            this.context.message.error(this.translate('Failed to save form data'));
            this.ctx.shared.__onSubmitSuccess?.(originalValues);
          });
          this.ctx.shared.__onSubmitSuccess?.(formValues);
          this.ctx.shared.currentView.close();
        }}
      >
        <FormProvider form={this.form}>
          <FormLayout layout={'vertical'}>
            {this.mapSubModels('fields', (field) => {
              return (
                <FlowModelRenderer
                  key={field.uid}
                  model={field}
                  sharedContext={{ currentRecord: this.resource.getData() }}
                  fallback={<Skeleton.Input size="small" />}
                />
              );
            })}
          </FormLayout>
          <FormButtonGroup align="right">
            <Button
              onClick={() => {
                this.ctx.shared.currentView.close();
              }}
            >
              {this.translate('Cancel')}
            </Button>
            <Button type="primary" htmlType="submit">
              {this.translate('Submit')}
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
  steps: {
    init: {
      async handler(ctx, params) {
        const { dataSourceKey, collectionName, fieldPath } = params;
        if (!dataSourceKey || !collectionName || !fieldPath) {
          throw new Error('dataSourceKey, collectionName and fieldPath are required parameters');
        }
        ctx.model.fieldPath = fieldPath;
        ctx.model.collection = ctx.globals.dataSourceManager.getCollection(dataSourceKey, collectionName);
        ctx.model.form = createForm();
        const resource = new SingleRecordResource();
        resource.setDataSourceKey(dataSourceKey);
        resource.setResourceName(collectionName);
        resource.setAPIClient(ctx.globals.api);
        ctx.model.resource = resource;
        const collectionField = ctx.model.collection.getField(fieldPath) as CollectionField;
        if (collectionField) {
          const use = collectionField.getFirstSubclassNameOf('EditableFieldModel') || 'EditableFieldModel';
          ctx.model.addSubModel('fields', {
            use,
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
          ctx.model.addAppends(fieldPath);
        }
        if (ctx.runtimeArgs.filterByTk || ctx.runtimeArgs.record) {
          resource.setFilterByTk(ctx.runtimeArgs.filterByTk);
          resource.setData(ctx.runtimeArgs.record);
          ctx.model.form.setInitialValues(resource.getData());
        }
      },
    },
  },
});

QuickEditForm.define({
  hide: true,
});
