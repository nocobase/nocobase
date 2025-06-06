/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import { uid } from '@formily/shared';
import { FlowEngineProvider, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Card, Dropdown, Modal, Space, Table } from 'antd';
import React from 'react';
import { FlowPage, FlowPageComponent } from '../FlowPage';
import { BlockFlowModel } from './BlockFlowModel';

function generateMockColumns(count = 50) {
  const columns: Record<string, any> = {};
  for (let i = 1; i <= count; i++) {
    const key = `mock_col_${i}`;
    columns[key] = {
      title: `Mock列${i}`,
      dataIndex: key,
      ellipsis: true,
      width: 150,
      key,
    };
  }
  return columns;
}

const columns = generateMockColumns(10);
function generateMockData(columns: Record<string, any>, count = 200) {
  const data: any[] = [];
  for (let i = 1; i <= count; i++) {
    const row: any = { key: i };
    for (const colKey of Object.keys(columns)) {
      row[colKey] = `数据${i}-${colKey}`;
    }
    data.push(row);
  }
  return data;
}

async function queryDataSource() {
  // 返回 200 条 mock 数据
  return generateMockData(columns, 20);
}

export class ActionFlowModel extends FlowModel {
  render() {
    return (
      <Button
        onClick={() => {
          this.dispatchEvent('onClick');
        }}
        {...this.props}
      />
    );
  }
}

ActionFlowModel.registerFlow({
  key: 'clickFlow',
  on: {
    eventName: 'onClick',
  },
  steps: {
    step1: {
      async handler(ctx) {
        ctx.logger.info('Action clicked:', ctx);
        // 可以在这里处理点击事件
        Modal.info({
          title: 'Action Clicked',
          footer: null,
          icon: null,
          width: '60%',
          maskClosable: true,
          content: (
            <FlowEngineProvider engine={ctx.globals.app.flowEngine}>
              <FlowPageComponent uid={`${ctx.model.uid}-view`} />
            </FlowEngineProvider>
          ),
        });
      },
    },
  },
});

export class TableColumnFlowModel extends FlowModel {
  render() {
    return (value, record, index) => {
      return value;
    };
  }
}

export class TableBlockFlowModel extends BlockFlowModel {
  onInit(options: any) {
    const { actions = [], columns = [] } = options;
    console.log('TableBlockFlowModel onInit', options);
    actions.forEach((action) => {
      this.addSubModel('actions', action);
    });
    columns.forEach((column) => {
      this.addSubModel('columns', column);
    });
  }

  addColumn(column) {
    const model = this.addSubModel('columns', column);
    model.save();
  }

  getColumns() {
    return (this.subModels.columns as TableColumnFlowModel[])? //TODO: improve type
      .map((column) => {
        return {
          ...column.getProps(),
          render: column.render(),
        };
      })
      .concat({
        key: 'addColumn',
        fixed: 'right',
        title: (
          <Dropdown
            menu={{
              onClick: (info) => {
                this.addColumn({
                  use: 'TableColumnFlowModel',
                  props: {
                    title: `新列 ${uid()}`,
                    dataIndex: `newColumn${(this.subModels.columns as TableColumnFlowModel[]).length + 1}`,
                    key: `newColumn${(this.subModels.columns as TableColumnFlowModel[]).length + 1}`,
                  },
                });
              },
              items: [
                { key: 'field1', label: 'Field 1' },
                { key: 'field2', label: 'Field 2' },
              ],
            }}
          >
            <Button>Add column</Button>
          </Dropdown>
        ),
      } as any);
  }

  addAction(action) {
    const model = this.addSubModel('actions', action);
    model.save();
  }

  renderActions() {
    return (
      <Space>
        {(this.subModels.actions as ActionFlowModel[])?.map((action) => {
          return <FlowModelRenderer key={action.uid} model={action} />;
        })}
        <Dropdown
          menu={{
            onClick: (info) => {
              this.addAction({
                use: 'ActionFlowModel',
                props: {
                  // type: 'primary',
                  children: `新动作 ${uid()}`,
                  // onClick: async () => {},
                },
              });
            },
            items: [
              { key: 'add-new', label: 'Add new' },
              { key: 'edit', label: 'Edit' },
            ],
          }}
        >
          <Button>Add action</Button>
        </Dropdown>
      </Space>
    );
  }

  render() {
    return (
      <Card>
        {this.renderActions()}
        <br />
        <br />
        <Table
          {...this.props}
          // pagination={{ defaultPageSize: 200 }}
          scroll={{ x: 'max-content', y: 600 }}
          columns={this.getColumns()}
        />
      </Card>
    );
  }
}

TableBlockFlowModel.registerFlow<TableBlockFlowModel>('defaultFlow', {
  auto: true,
  steps: {
    step1: {
      uiSchema: {},
      async handler(ctx) {
        ctx.model.setProps('dataSource', await queryDataSource());
      },
    },
    step2: {
      uiSchema: {},
      handler(ctx, params) {
        for (const key of params.columns) {
          if (!columns[key]) {
            throw new Error(`Column ${key} is not defined.`);
          }
          ctx.model.addColumn({
            use: 'TableColumnFlowModel',
            props: columns[key],
          });
        }
      },
    },
  },
});

TableBlockFlowModel.define({
  title: 'Table',
  group: 'Content',
  defaultOptions: {
    use: 'TableBlockFlowModel',
    columns: [],
    actions: [
      {
        use: 'ActionFlowModel',
        props: {
          type: 'primary',
          children: '查询数据',
        },
      },
    ],
    stepParams: {
      defaultFlow: {
        step2: {
          columns: Object.keys(columns), // 默认添加前5列
        },
      },
    },
  },
});
