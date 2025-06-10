/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, FlowModel, MultiRecordResource } from '@nocobase/flow-engine';
import { Button, Card, Dropdown, Table } from 'antd';
import React from 'react';
import { BlockFlowModel } from './BlockFlowModel';
import { TableColumnModel } from './table-column-model';

type S = {
  subModels: {
    columns: TableColumnModel[];
  };
};

export class TableModel extends BlockFlowModel<S> {
  collection: Collection;
  resource: MultiRecordResource;

  getColumns() {
    return this.mapSubModels('columns', (column) => column.getColumnProps()).concat({
      key: 'addColumn',
      fixed: 'right',
      title: (
        <Dropdown
          menu={{
            onClick: (info) => {
              const model = this.addSubModel('columns', {
                use: 'TableColumnModel',
                stepParams: {
                  default: {
                    step1: {
                      fieldPath: info.key,
                    },
                  },
                },
              });
              model.applyAutoFlows();
              model.save();
            },
            items: this.collection.mapFields((field) => {
              return {
                key: `${this.collection.dataSource.name}.${this.collection.name}.${field.name}`,
                label: field.title,
              };
            }),
          }}
        >
          <Button>Add column</Button>
        </Dropdown>
      ),
    } as any);
  }

  render() {
    return (
      <Card>
        <Table
          rowKey="id"
          dataSource={this.resource.getData()}
          columns={this.getColumns()}
          pagination={{
            current: this.resource.getMeta('page'),
            pageSize: this.resource.getMeta('pageSize'),
            total: this.resource.getMeta('count'),
          }}
          onChange={(pagination) => {
            this.resource.setPage(pagination.current);
            this.resource.setPageSize(pagination.pageSize);
            this.resource.refresh();
          }}
        />
      </Card>
    );
  }
}

TableModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
    step1: {
      paramsRequired: true,
      hideInSettings: true,
      uiSchema: {
        dataSourceKey: {
          type: 'string',
          title: 'Data Source Key',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: 'Enter data source key',
          },
        },
        collectionName: {
          type: 'string',
          title: 'Collection Name',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: 'Enter collection name',
          },
        },
      },
      defaultParams: {
        dataSourceKey: 'main',
      },
      handler: async (ctx, params) => {
        const collection = ctx.globals.dataSourceManager.getCollection(params.dataSourceKey, params.collectionName);
        ctx.model.collection = collection;
        const resource = new MultiRecordResource();
        resource.setDataSourceKey(params.dataSourceKey);
        resource.setResourceName(params.collectionName);
        resource.setAPIClient(ctx.globals.api);
        ctx.model.resource = resource;
        await resource.refresh();
        await ctx.model.applySubModelsAutoFlows('columns');
      },
    },
  },
});

TableModel.define({
  title: 'Table',
  group: 'Content',
  defaultOptions: {
    use: 'TableModel',
  },
});
