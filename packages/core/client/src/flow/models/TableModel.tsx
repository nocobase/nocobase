/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import {
  AddActionModel,
  AddFieldModel,
  Collection,
  FlowModelRenderer,
  MultiRecordResource,
} from '@nocobase/flow-engine';
import { Card, Table } from 'antd';
import React from 'react';
import { BlockFlowModel } from './BlockFlowModel';
import { TableColumnModel } from './TableColumnModel';
import { ActionModel } from './ActionModel';
import { SettingOutlined } from '@ant-design/icons';
import { observable } from '@formily/reactive';

type S = {
  subModels: {
    columns: TableColumnModel[];
    actions: ActionModel[];
  };
};

export class TableModel extends BlockFlowModel<S> {
  collection: Collection;
  resource: MultiRecordResource;
  selectedRows = observable.shallow([]);

  getColumns() {
    return this.mapSubModels('columns', (column) => {
      return column.getColumnProps();
    }).concat({
      key: 'addColumn',
      fixed: 'right',
      title: (
        <AddFieldModel
          collection={this.collection}
          model={this}
          subModelKey={'columns'}
          onModelAdded={async (model: TableColumnModel) => {
            await model.applyAutoFlows();
          }}
          items={async () => {
            return [
              {
                key: 'addField',
                label: 'Collection fields',
                type: 'group',
                children: async () => {
                  return this.collection.getFields().map((field) => {
                    return {
                      key: field.name,
                      label: field.title,
                      createModelOptions: {
                        use: 'TableColumnModel',
                        stepParams: {
                          default: {
                            step1: {
                              fieldPath: field.fullpath,
                            },
                          },
                        },
                      },
                    };
                  });
                },
              },
              {
                type: 'divider',
              },
              {
                key: 'actions',
                label: 'Actions column',
                createModelOptions: {
                  use: 'TableActionsColumnModel',
                },
              },
            ];
          }}
        />
      ),
    } as any);
  }

  renderActions() {
    return this.mapSubModels('actions', (action) => {
      return <FlowModelRenderer key={action.uid} model={action} showFlowSettings />;
    });
  }

  setSelectedRows(rows) {
    this.selectedRows.length = 0;
    this.selectedRows.push(...rows);
  }

  render() {
    return (
      <Card>
        {this.renderActions()}
        <AddActionModel
          model={this}
          subModelKey={'actions'}
          items={() => [
            {
              key: 'action1',
              label: 'Action 1',
              createModelOptions: {
                use: 'BulkDeleteActionModel',
              },
            },
          ]}
        >
          <SettingOutlined />
        </AddActionModel>
        <Table
          className={css`
            td {
              height: 39px;
            }
          `}
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
          rowSelection={{
            onChange: (selectedRowKeys, selectedRows) => {
              this.setSelectedRows(selectedRows);
            },
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
    subModels: {
      columns: [
        {
          use: 'TableActionsColumnModel',
          subModels: {
            actions: [
              {
                use: 'ActionModel',
              },
            ],
          },
        },
      ],
    },
  },
});
