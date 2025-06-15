import { observable } from '@formily/reactive';
import { uid } from '@formily/shared';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Dropdown, Space, Table, Tabs } from 'antd';
import React from 'react';

async function queryDataSource() {
  return [
    {
      key: '1',
      name: '胡彦斌',
      age: 32,
      address: '西湖区湖底公园1号',
    },
    {
      key: '2',
      name: '胡彦祖',
      age: 42,
      address: '西湖区湖底公园1号',
    },
  ];
}

class ActionFlowModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}

class TableColumnFlowModel extends FlowModel {
  render() {
    return (value, record, index) => {
      return value;
    };
  }
}

type TableBlockFlowModelStructure = {
  subModels: {
    columns: TableColumnFlowModel[],
    actions: ActionFlowModel[],
  }
}

class TableBlockFlowModel extends FlowModel<TableBlockFlowModelStructure> {

  addColumn(column) {
    return this.addSubModel('columns', column);
  }

  getColumns() {
    return this.subModels.columns
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
                    dataIndex: `newColumn${this.subModels.columns.length + 1}`,
                    key: `newColumn${this.subModels.columns.length + 1}`,
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
    return this.addSubModel('actions', action);
  }

  renderActions() {
    return (
      <Space>
        {this.subModels.actions.map((action) => {
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
      <div>
        {this.renderActions()}
        <br />
        <br />
        <Table {...this.props} scroll={{ x: 'max-content' }} columns={this.getColumns()} />
      </div>
    );
  }
}

TableBlockFlowModel.registerFlow('defaultFlow', {
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
        const columns = {
          name: {
            title: '姓名',
            dataIndex: 'name',
            key: 'name',
          },
          age: {
            title: '年龄',
            dataIndex: 'age',
            key: 'age',
          },
          address: {
            title: '住址',
            dataIndex: 'address',
            key: 'address',
          },
        };
        for (const key of params.columns) {
          if (!columns[key]) {
            throw new Error(`Column ${key} is not defined.`);
          }
          ctx.model.addColumn({
            use: 'TableColumnFlowModel',
            props: columns['address'],
          });
        }
      },
    },
  },
});

// 插件定义
class PluginTableBlockModel extends Plugin {
  async load() {
    this.flowEngine.registerModels({ TableBlockFlowModel, TableColumnFlowModel, ActionFlowModel });
    const model = this.flowEngine.createModel({
      use: 'TableBlockFlowModel',
      subModels: {
        columns: [
          {
            use: 'TableColumnFlowModel',
            props: {
              title: '姓名',
              dataIndex: 'name',
              key: 'name',
            },
          },
        ],
        actions: [
          {
            use: 'ActionFlowModel',
            props: {
              type: 'primary',
              children: '查询数据',
            },
          },
        ],
      },
      stepParams: {
        defaultFlow: {
          step2: {
            columns: ['name', 'age'],
          },
        },
      },
    });
    this.router.add('root', { path: '/', element: <FlowModelRenderer model={model} /> });
  }
}

// 创建应用实例
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginTableBlockModel],
});

export default app.getRootComponent();
