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
  useApplyAutoFlows,
} from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Button, InputRef, Skeleton } from 'antd';
import _ from 'lodash';
import React, { createRef, Suspense, useEffect, useState } from 'react';
import { SkeletonFallback } from '../../../components/SkeletonFallback';
import { DataBlockModel } from '../../base/BlockModel';

function SimpleFlowModelRenderer(props) {
  const { fallback, model, sharedContext, extraContext } = props;
  const { loading } = useRequest(
    async () => {
      await model.applyAutoFlows(extraContext);
      model.setSharedContext(sharedContext);
    },
    {
      refreshDeps: [model, sharedContext, extraContext],
    },
  );

  if (loading) {
    return <>{fallback}</>;
  }

  return model.render();
}

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
    onSuccess?: (values: any) => void;
  }) {
    // this.now = Date.now();
    const { flowEngine, target, dataSourceKey, collectionName, fieldPath, filterByTk, onSuccess } = options;
    const model = flowEngine.createModel({
      use: 'QuickEditForm',
      stepParams: {
        propsFlow: {
          step1: {
            dataSourceKey,
            collectionName,
            fieldPath,
          },
        },
      },
    }) as QuickEditForm;

    console.log('QuickEditForm.open2', Date.now() - model.now);
    model.now = Date.now();

    await flowEngine.context.popover.open({
      target,
      placement: 'rightTop',
      content: (popover) => {
        console.log('QuickEditForm.open3', Date.now() - model.now);
        return (
          <SimpleFlowModelRenderer
            sharedContext={{
              currentView: popover,
              __onSubmitSuccess: onSuccess,
            }}
            fallback={<Skeleton.Input size="small" />}
            model={model}
            extraContext={{ filterByTk }}
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
          await this.resource.save(
            {
              [this.fieldPath]: this.form.values[this.fieldPath],
            },
            { refresh: false },
          );
          this.ctx.shared.__onSubmitSuccess?.({
            [this.fieldPath]: this.form.values[this.fieldPath],
          });
          this.ctx.shared.currentView.close();
        }}
      >
        <FormProvider form={this.form}>
          <FormLayout layout={'vertical'}>
            {this.mapSubModels('fields', (field) => {
              return (
                <SimpleFlowModelRenderer
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
  key: 'propsFlow',
  auto: true,
  steps: {
    step1: {
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
              default: {
                step1: {
                  dataSourceKey,
                  collectionName,
                  fieldPath,
                },
              },
            },
          });
          ctx.model.addAppends(fieldPath);
        }
        if (ctx.extra.filterByTk) {
          resource.setFilterByTk(ctx.extra.filterByTk);
          await resource.refresh();
          ctx.model.form.setInitialValues(resource.getData());
        }
      },
    },
  },
});

QuickEditForm.define({
  hide: true,
});
