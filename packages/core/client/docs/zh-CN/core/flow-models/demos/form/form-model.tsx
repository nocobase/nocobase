import { FormButtonGroup, FormDialog, FormItem, Input, Submit } from '@formily/antd-v5';
import { createForm, Form } from '@formily/core';
import { FormProvider } from '@formily/react';
import {
  Collection,
  FlowEngineProvider,
  FlowModel,
  FlowModelRenderer,
  SingleRecordResource,
} from '@nocobase/flow-engine';
import { Card } from 'antd';
import React from 'react';
import { api } from '../table/api';

export class FormModel extends FlowModel {
  form: Form;
  resource: SingleRecordResource;
  collection: Collection;

  render() {
    return (
      <div>
        <FormProvider form={this.form}>
          {this.mapSubModels('fields', (field) => (
            <FlowModelRenderer model={field} />
          ))}
          <FormButtonGroup>
            {this.mapSubModels('actions', (action) => (
              <FlowModelRenderer model={action} />
            ))}
          </FormButtonGroup>
          <br />
          <Card>
            <pre>{JSON.stringify(this.form.values, null, 2)}</pre>
          </Card>
        </FormProvider>
      </div>
    );
  }

  async openDialog({ filterByTk }) {
    return new Promise((resolve) => {
      const dialog = FormDialog(
        {
          footer: null,
          title: 'Form Dialog',
        },
        (form) => {
          return (
            <div>
              <FlowEngineProvider engine={this.flowEngine}>
                <FlowModelRenderer model={this} extraContext={{ form, filterByTk }} />
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
              </FlowEngineProvider>
            </div>
          );
        },
      );
      dialog.open();
      // 可选：如果需要在取消时也 resolve，可以监听 dialog 的 onCancel
    });
  }
}

FormModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
    step1: {
      async handler(ctx, params) {
        ctx.model.form = ctx.extra.form || createForm();
        if (ctx.model.collection) {
          return;
        }
        ctx.model.collection = ctx.globals.dsm.getCollection(params.dataSourceKey, params.collectionName);
        const resource = new SingleRecordResource();
        resource.setDataSourceKey(params.dataSourceKey);
        resource.setResourceName(params.collectionName);
        resource.setAPIClient(api);
        ctx.model.resource = resource;
        if (ctx.extra.filterByTk) {
          resource.setFilterByTk(ctx.extra.filterByTk);
          await resource.refresh();
          ctx.model.form.setInitialValues(resource.getData());
        }
      },
    },
  },
});
