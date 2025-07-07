/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormLayout } from '@formily/antd-v5';
import {
  AddFieldButton,
  FlowModelRenderer,
  MultiRecordResource,
  SingleRecordResource,
  buildActionItems,
  buildFieldItems,
  escapeT,
} from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import { Pagination, theme } from 'antd';
import _ from 'lodash';
import React from 'react';
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
        fieldSettings: {
          init: {
            dataSourceKey: model.collection.dataSourceKey,
            collectionName: model.collection.name,
            fieldPath,
          },
        },
      },
      subModels: {
        field: {
          use: defaultOptions.use,
          stepParams: {
            fieldSettings: {
              init: {
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

  createResource(ctx, params) {
    if (Object.keys(params).includes('filterByTk')) {
      return new SingleRecordResource();
    }
    const resource = new MultiRecordResource();
    resource.setPageSize(1);
    return resource;
  }

  isMultiRecordResource() {
    return this.resource instanceof MultiRecordResource;
  }

  renderComponent() {
    const filterByTk = this.resource.getFilterByTk();
    const resource = this.resource as MultiRecordResource;
    const onPageChange = (page) => {
      resource.setPage(page);
      resource.refresh();
    };
    return (
      <>
        {/* <div style={{ padding: token.padding, textAlign: 'right' }}>
          <AddActionButton model={this} items={buildActionItems(this, 'DetailActionModel')} />
        </div>
        <FormButtonGroup style={{ marginTop: 16 }}>
          {this.mapSubModels('actions', (action) => (
            <FlowModelRenderer
              key={action.uid}
              model={action}
              showFlowSettings={{ showBackground: false, showBorder: false }}
              sharedContext={{ record: this.resource.getData() }}
            />
          ))}
        </FormButtonGroup> */}
        <FormLayout layout={'vertical'}>
          {this.mapSubModels('detailItem', (field: DetailItemModel) => {
            return <FlowModelRenderer key={field.uid} model={field} showFlowSettings={{ showBorder: false }} />;
          })}
        </FormLayout>
        <AddDetailField model={this} />
        {this.isMultiRecordResource() && (
          <div
            style={{
              padding: this.context.themeToken.padding,
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
        )}
      </>
    );
  }
}

DetailsModel.registerFlow({
  key: 'detailsSettings',
  title: escapeT('Details settings'),
  auto: true,
  sort: 150,
  steps: {
    dataLoadingMode: {
      use: 'dataLoadingMode',
    },
    refresh: {
      async handler(ctx, params) {
        const { dataLoadingMode } = ctx.model.props;
        if (dataLoadingMode === 'auto') {
          await ctx.model.resource.refresh();
        } else {
          ctx.model.resource.loading = false;
        }
      },
    },
  },
});

DetailsModel.define({
  title: tval('Details'),
  group: 'Content',
  defaultOptions: {
    use: 'DetailsModel',
  },
  sort: 300,
});
