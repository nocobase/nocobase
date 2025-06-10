import { Collection, FlowModel, MultiRecordResource } from '@nocobase/flow-engine';
import { Button, Dropdown, Table } from 'antd';
import React from 'react';
import { api } from './api';
import { TableColumnModel } from './table-column-model';

type S = {
  subModels: {
    columns: TableColumnModel[];
  };
};

export class TableModel extends FlowModel<S> {
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
      <div>
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
      </div>
    );
  }
}

TableModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
    step1: {
      async handler(ctx, params) {
        if (ctx.model.collection) {
          return;
        }
        ctx.model.collection = ctx.globals.dsm.getCollection(params.dataSourceKey, params.collectionName);
        const resource = new MultiRecordResource();
        resource.setDataSourceKey(params.dataSourceKey);
        resource.setResourceName(params.collectionName);
        resource.setAPIClient(api);
        ctx.model.resource = resource;
        await resource.refresh();
        await Promise.all(
          ctx.model.mapSubModels('columns', async (column) => {
            await column.applyAutoFlows();
          }),
        );
      },
    },
  },
});
