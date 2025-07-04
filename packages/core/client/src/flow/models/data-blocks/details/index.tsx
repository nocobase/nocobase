/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EditOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { observer } from '@formily/reactive-react';
import {
  FlowModel,
  MultiRecordResource,
  AddActionButton,
  AddFieldButton,
  FlowModelRenderer,
  SingleRecordResource,
  buildFieldItems,
  buildActionItems,
} from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import { FormProvider } from '@formily/react';
import { FormButtonGroup, FormLayout } from '@formily/antd-v5';
import { Pagination, theme } from 'antd';
import _ from 'lodash';
import { createForm, Form } from '@formily/core';
import React, { useRef } from 'react';
import { ActionModel } from '../../base/ActionModel';
import { DataBlockModel } from '../../base/BlockModel';
import { DetailItemModel } from './DetailItemModel';

const AddDetailField = ({ model }) => {
  const items = buildFieldItems(
    model.collection.getFields(),
    model,
    'ReadPrettyFieldModel',
    'detailItem',
    ({ defaultOptions, fieldPath }) => ({
      use: 'DetailItemModel',
      stepParams: {
        default: {
          step1: {
            dataSourceKey: model.collection.dataSourceKey,
            collectionName: model.collection.name,
            fieldPath,
          },
        },
      },
      subModels: {
        field: {
          // @ts-ignore
          use: defaultOptions.use as any,
          stepParams: {
            default: {
              step1: {
                dataSourceKey: model.collection.dataSourceKey,
                collectionName: model.collection.name,
                fieldPath,
              },
            },
          },
        },
      },
    }),
  );
  return (
    <AddFieldButton
      collection={model.resourceName}
      model={model}
      subModelKey={'detailItem'}
      subModelBaseClass="DetailFormItemModel"
      items={items}
      onModelCreated={async (item: DetailItemModel) => {
        const field: any = item.subModels.field;
        await field.applyAutoFlows();
      }}
      onSubModelAdded={async (item: DetailItemModel) => {
        const field: any = item.subModels.field;
        model.addAppends(field.fieldPath, true);
      }}
    />
  );
};

export class DetailsModel extends DataBlockModel {
  declare resource: MultiRecordResource | SingleRecordResource;

  renderComponent() {
    const { token } = theme.useToken();

    const resource: any = this.resource;
    const onPageChange = (page) => {
      resource.setPage(page);
      resource.refresh();
    };
    return (
      <>
        <div style={{ padding: token.padding, textAlign: 'right' }}>
          <AddActionButton model={this} items={buildActionItems(this, 'DetailActionModel')} />
        </div>
        <FormButtonGroup style={{ marginTop: 16 }}>
          {this.mapSubModels('actions', (action) => (
            <FlowModelRenderer
              key={action.uid}
              model={action}
              showFlowSettings={{ showBackground: false, showBorder: false }}
              sharedContext={{ currentRecord: this.resource.getData() }}
            />
          ))}
        </FormButtonGroup>
        <FormLayout layout={'vertical'}>
          {this.mapSubModels('detailItem', (field: DetailItemModel) => {
            return (
              <FlowModelRenderer
                key={field.uid}
                model={field}
                showFlowSettings={{ showBorder: false }}
                sharedContext={{ currentRecord: this.resource.getData() }}
              />
            );
          })}
        </FormLayout>
        <AddDetailField model={this} />
        <div
          style={{
            padding: token.padding,
            textAlign: 'center',
          }}
        >
          <Pagination
            simple
            pageSize={1}
            defaultCurrent={resource.getPage()}
            total={resource.getTotalPage()}
            onChange={onPageChange}
            style={{ display: 'inline-block' }}
          />
        </div>
      </>
    );
  }
}

DetailsModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
    step1: {
      paramsRequired: true,
      hideInSettings: true,
      uiSchema: {
        dataSourceKey: {
          type: 'string',
          title: tval('Data Source Key'),
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: tval('Enter data source key'),
          },
        },
        collectionName: {
          type: 'string',
          title: tval('Collection Name'),
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: tval('Enter collection name'),
          },
        },
      },
      defaultParams: {
        dataSourceKey: 'main',
      },
      async handler(ctx, params) {
        const filterByTk = ctx.shared?.currentFlow?.extra?.filterByTk;
        if (!filterByTk) {
          ctx.model.collection = ctx.globals.dataSourceManager.getCollection(
            params.dataSourceKey,
            params.collectionName,
          );
          const resource = new MultiRecordResource();
          resource.setDataSourceKey(params.dataSourceKey);
          resource.setResourceName(params.collectionName);
          resource.setAPIClient(ctx.globals.api);
          resource.setPageSize(1);
          ctx.model.resource = resource;

          await ctx.model.applySubModelsAutoFlows('fields');
        } else {
          const resource = new SingleRecordResource();
          resource.setDataSourceKey(params.dataSourceKey);
          resource.setResourceName(params.collectionName);
          resource.setAPIClient(ctx.globals.api);
          ctx.model.resource.setFilterByTk(filterByTk);
          await ctx.model.resource.refresh();
        }
      },
    },
    refresh: {
      async handler(ctx, params) {
        await ctx.model.resource.refresh();
      },
    },
  },
});

DetailsModel.define({
  title: tval('Details'),
  group: 'Content',
  defaultOptions: {
    use: 'DetailModel',
  },
  sort: 300,
});
