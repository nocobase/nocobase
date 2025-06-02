import React from 'react';
import { Table, Button, Space, Pagination, Spin, Divider, ButtonProps } from 'antd';
import { Application, Plugin } from '@nocobase/client';
import {
  BlockModel,
  FlowsDropdownButton,
  FlowsContextMenu,
  AddAction,
  BaseResource,
  FlowContext,
  FlowModel,
  useFlowModel,
  withFlowModel,
  FlowsFloatContextMenu,
} from '@nocobase/flow-engine';
import { observer } from '@formily/react';

const Demo = () => {
  const uid = 'table-block';
  const model = useFlowModel(uid, 'DemoTableBlockModel') as any;

  return (
    <div style={{ padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
      <AddAction model={model} />
      <ActionsComponent model={model} />
      <Divider />
      <FlowsDropdownButton model={model} text="表格配置" size="small" type="dashed" />
      <TableBlock model={model} />
    </div>
  );
};

// 表格组件
const TableComponent = ({
  loading = false,
  columns = [],
  dataSource = [],
  pagination = { current: 1, pageSize: 10, total: 0 },
  height = 400,
  title = '数据表格',
  onPaginationChange,
}) => {
  return (
    <div style={{ marginTop: 16, height: height }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          padding: '12px 16px',
          background: '#fff',
          borderRadius: 6,
          border: '1px solid #d9d9d9',
        }}
      >
        <h3 style={{ margin: 0 }}>{title}</h3>
      </div>

      <Spin spinning={loading}>
        <Table dataSource={dataSource} columns={columns} pagination={false} scroll={{ y: height }} rowKey="id" />
      </Spin>

      {pagination.total > 0 && (
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条数据`}
            onChange={onPaginationChange}
            onShowSizeChange={onPaginationChange}
          />
        </div>
      )}
    </div>
  );
};

const ActionButton = withFlowModel(
  (props: ButtonProps & { text?: string }) => {
    const { text, ...rest } = props;
    return <Button {...rest}>{text}</Button>;
  },
  {
    settings: {
      component: FlowsFloatContextMenu,
      // component: FlowsContextMenu
    },
  },
);

// Actions组件 - 渲染工具栏操作
const ActionsComponent = observer(({ model }: { model: BlockModel }) => {
  if (!model.actions.size) return null;

  return (
    <div style={{ marginBottom: 16, textAlign: 'right' }}>
      <Space>
        {Array.from(model.actions.values()).map((action) => (
          <ActionButton key={action.uid} model={action} />
        ))}
      </Space>
    </div>
  );
});

const TableBlock = withFlowModel(TableComponent);

// 创建继承自BlockModel的DemoTableBlockModel
class DemoTableBlockModel extends BlockModel {
  private resources: Map<string, any> = new Map();

  setResource(key: string, resource: any): void {
    this.resources.set(key, resource);
  }

  getResource(key: string): any {
    return this.resources.get(key);
  }

  static {
    this.registerFlow({
      key: 'setProps',
      title: '表格属性',
      auto: true,
      steps: {
        setFields: {
          use: 'setTableFields',
          title: '字段配置',
          defaultParams: {
            fields: ['id', 'name', 'age', 'email', 'city'],
          },
        },
        convertToColumns: {
          handler: async (ctx: FlowContext) => {
            // 将字段转换为表格列
            const props = ctx.model.getProps();
            const fields = props['fields'] || [];
            const fieldLabels = {
              id: 'ID',
              name: '姓名',
              age: '年龄',
              email: '邮箱',
              city: '城市',
            };

            const columns = fields.map((field) => ({
              title: fieldLabels[field] || field,
              dataIndex: field,
              key: field,
              width: field === 'id' ? 80 : field === 'email' ? 200 : 120,
            }));

            ctx.model.setProps('columns', columns);
          },
        },
        setTitle: {
          use: 'setTableTitle',
          title: '设置标题',
          defaultParams: { title: '用户数据表格' },
        },
        setupDataSource: {
          handler: async (ctx: FlowContext) => {
            // 设置数据源
            const dataResource = (ctx.model as any).getResource('data');
            const tableData = dataResource?.getData() || [];
            ctx.model.setProps('dataSource', tableData);
          },
        },
        setupPaginationHandler: {
          handler: async (ctx: FlowContext) => {
            // 设置分页处理函数
            const onPaginationChange = (page: number, pageSize: number) => {
              ctx.model.dispatchEvent('table:pagination:change', { current: page, pageSize });
            };
            ctx.model.setProps('onPaginationChange', onPaginationChange);
          },
        },
        initDataResource: {
          handler: async (ctx: FlowContext) => {
            const dataResource = new BaseResource([]);
            (ctx.model as any).setResource('data', dataResource);
          },
        },
      },
    });

    this.registerFlow({
      key: 'pagination',
      title: '分页操作',
      on: {
        eventName: 'table:pagination:change',
      },
      steps: {
        updatePagination: {
          handler: async (ctx: FlowContext, params) => {
            const { current, pageSize } = params || {};
            const currentPagination = ctx.model.getProps().pagination || {};

            ctx.model.setProps('pagination', {
              ...currentPagination,
              current: current || currentPagination.current,
              pageSize: pageSize || currentPagination.pageSize,
            });

            ctx.model.applyFlow('loadData');
          },
        },
      },
    });

    this.registerFlow<DemoTableBlockModel>({
      key: 'loadData',
      title: '数据加载',
      steps: {
        setLoading: {
          handler: async (ctx: FlowContext) => {
            ctx.model.setProps('loading', true);
          },
        },
        fetchData: {
          handler: async (ctx: FlowContext) => {
            // 添加延迟以模拟真实API请求
            await new Promise((resolve) => setTimeout(resolve, 500));

            const props = ctx.model.getProps();
            const pagination = props.pagination || { current: 1, pageSize: 10 };

            try {
              const mockData = generateMockData(pagination.current, pagination.pageSize);

              const dataResource = (ctx.model as any).getResource('data');
              if (dataResource) {
                dataResource.setData(mockData.data);
              }

              ctx.model.setProps('pagination', {
                ...pagination,
                total: mockData.total,
              });
            } catch (error) {
              console.error('Failed to load data:', error);
            }
          },
        },
        updateDataSource: {
          handler: async (ctx: FlowContext) => {
            const dataResource = ctx.model['getResource']('data');
            const tableData = dataResource?.getData() || [];
            ctx.model.setProps('dataSource', tableData);
          },
        },
        setLoadingEnd: {
          handler: async (ctx: FlowContext) => {
            ctx.model.setProps('loading', false);
          },
        },
      },
    });
  }
}

function generateMockData(page: number, pageSize: number) {
  const total = 256;
  const startIndex = (page - 1) * pageSize;
  const data = [];

  for (let i = 0; i < pageSize && startIndex + i < total; i++) {
    const id = startIndex + i + 1;
    data.push({
      id,
      name: `用户${id}`,
      age: 20 + (id % 40),
      email: `user${id}@example.com`,
      city: ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉'][id % 8],
    });
  }

  return { data, total };
}

class DemoTablePlugin extends Plugin {
  async load() {
    this.app.flowEngine.registerModelClass('DemoTableBlockModel', DemoTableBlockModel);

    this.app.flowEngine.registerAction({
      name: 'setTableFields',
      title: '字段配置',
      uiSchema: {
        fields: {
          type: 'array',
          title: '显示列',
          'x-component': 'Select',
          'x-component-props': {
            mode: 'multiple',
            options: [
              { label: 'ID', value: 'id' },
              { label: '姓名', value: 'name' },
              { label: '年龄', value: 'age' },
              { label: '邮箱', value: 'email' },
              { label: '城市', value: 'city' },
            ],
          },
        },
      },
      handler: (ctx: FlowContext, params: any) => {
        if (params?.fields) {
          ctx.model.setProps('fields', params.fields);
        }
      },
    });

    this.app.flowEngine.registerAction({
      name: 'setTableTitle',
      title: '标题设置',
      uiSchema: {
        title: {
          type: 'string',
          title: '表格标题',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      handler: (ctx: FlowContext, params: any) => {
        if (params?.title != null) {
          ctx.model.setProps('title', params.title);
        }
      },
    });

    this.app.flowEngine.registerAction({
      name: 'loadTableData',
      title: '加载数据',
      uiSchema: {},
      handler: (ctx: FlowContext, params: any) => {
        ctx.model.applyFlow('loadData');
      },
    });

    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [DemoTablePlugin],
});

export default app.getRootComponent();
