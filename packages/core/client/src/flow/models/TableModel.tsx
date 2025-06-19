/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import {
  AddActionModel,
  AddFieldButton,
  Collection,
  FlowModelRenderer,
  MultiRecordResource,
} from '@nocobase/flow-engine';
import { Button, Card, Space, Table } from 'antd';
import React from 'react';
import { ActionModel } from './ActionModel';
import { BlockFlowModel } from './BlockFlowModel';
import { TableColumnModel } from './TableColumnModel';

type S = {
  subModels: {
    columns: TableColumnModel[];
    actions: ActionModel[];
  };
};

export class TableModel extends BlockFlowModel<S> {
  collection: Collection;
  resource: MultiRecordResource;

  getColumns() {
    return this.mapSubModels('columns', (column) => {
      return column.getColumnProps();
    }).concat({
      key: 'addColumn',
      fixed: 'right',
      title: (
        <AddFieldButton
          collection={this.collection}
          model={this}
          subModelKey={'columns'}
          subModelBaseClass="TableColumnModel"
          buildCreateModelOptions={(field, fieldClass) => ({
            use: fieldClass.name,
            stepParams: {
              default: {
                step1: {
                  fieldPath: field.fullpath,
                },
              },
            },
          })}
          appendItems={[
            {
              key: 'actions',
              label: 'Actions column',
              createModelOptions: {
                use: 'TableActionsColumnModel',
              },
            },
          ]}
          onModelAdded={async (model: TableColumnModel) => {
            await model.applyAutoFlows();
          }}
        />
      ),
    } as any);
  }

  render() {
    return (
      <Card>
        <Space style={{ marginBottom: 16 }}>
          {this.mapSubModels('actions', (action) => (
            <FlowModelRenderer model={action} showFlowSettings sharedContext={{ currentBlockModel: this }} />
          ))}
          <AddActionModel
            model={this}
            subModelKey={'actions'}
            items={() => [
              {
                key: 'addnew',
                label: 'Add new',
                createModelOptions: {
                  use: 'AddNewActionModel',
                },
              },
              {
                key: 'delete',
                label: 'Delete',
                createModelOptions: {
                  use: 'BulkDeleteActionModel',
                },
              },
            ]}
          >
            <Button icon={<SettingOutlined />}>Configure actions</Button>
          </AddActionModel>
        </Space>
        <Table
          className={css`
            td {
              height: 39px;
            }
          `}
          rowKey="id"
          rowSelection={{
            type: 'checkbox',
            onChange: (_, selectedRows) => {
              this.resource.setSelectedRows(selectedRows);
            },
            selectedRowKeys: this.resource.getSelectedRows().map((row) => row.id),
          }}
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
        await ctx.model.applySubModelsAutoFlows('columns', null, { currentBlockModel: ctx.model });
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
