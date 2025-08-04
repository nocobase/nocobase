import { faker } from '@faker-js/faker';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer, MultiRecordResource } from '@nocobase/flow-engine';
import { Button, Flex, Form, Input, Popconfirm, Space, Table } from 'antd';
import MockAdapter from 'axios-mock-adapter';
import React from 'react';

class HelloModel extends FlowModel {
  declare resource: MultiRecordResource;

  // 定义主键字段，必须为唯一值
  rowKey = 'id';

  onInit(options) {
    super.onInit(options);
    // 自定义 t 方法，用于国际化
    // 这里的 ns 是 crud-models，表示这个 t 方法是针对 CrudModel
    this.context.defineMethod('t', (key, options) => {
      return this.context.i18n.t(key, {
        ...options,
        ns: '@nocobase/plugin-crud',
      });
    });
  }

  FormComponent = (props) => {
    const { drawer, record } = props;
    const [form] = Form.useForm();

    return (
      <div>
        <drawer.Header title={record ? 'Edit record' : 'Add record'} />

        <Form form={form} initialValues={record} layout="vertical" colon={true}>
          <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter name' }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Telephone" name="telephone" rules={[{ required: true, message: 'Please enter telephone' }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Live" name="live">
            <Input />
          </Form.Item>

          <Form.Item label="Address" name="address">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item label="Remark" name="remark">
            <Input />
          </Form.Item>
        </Form>

        <drawer.Footer>
          <Flex justify="flex-end" align="end">
            <Space>
              <Button
                onClick={() => {
                  drawer.close();
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={async () => {
                  try {
                    const values = await form.validateFields();
                    if (record) {
                      await this.resource.update(record[this.rowKey], values);
                    } else {
                      await this.resource.create(values);
                    }
                    this.context.message.success('Record save successfully');
                    drawer.close();
                  } catch (error) {
                    console.error('Validation failed:', error);
                  }
                }}
              >
                Submit
              </Button>
            </Space>
          </Flex>
        </drawer.Footer>
      </div>
    );
  };

  render() {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Flex justify="space-between" align="center">
          <Button>Filter</Button>
          <Space>
            <Popconfirm
              title="Are you sure to delete all selected records?"
              onConfirm={async () => {
                const selectedRowKeys = this.context.selectedRowKeys;
                if (selectedRowKeys && selectedRowKeys.length > 0) {
                  console.log('Deleting records with IDs:', selectedRowKeys);
                  await this.resource.destroy(selectedRowKeys);
                  this.context.message.success('Records deleted successfully');
                } else {
                  this.context.message.warning('No records selected');
                }
              }}
            >
              <Button>Delete</Button>
            </Popconfirm>
            <Button
              type="primary"
              onClick={() => {
                this.context.viewOpener.open({
                  mode: 'drawer',
                  width: '50%',
                  content: (drawer) => <this.FormComponent drawer={drawer} />,
                });
              }}
            >
              Add new
            </Button>
          </Space>
        </Flex>
        <Table
          dataSource={this.resource.getData()}
          rowKey={this.rowKey}
          rowSelection={{
            type: 'checkbox',
            onChange: (selectedRowKeys, selectedRows) => {
              this.context.defineProperty('selectedRowKeys', {
                get: () => selectedRowKeys,
              });
              this.context.defineProperty('selectedRows', {
                get: () => selectedRows,
              });
            },
          }}
          size="small"
          columns={[
            { title: 'ID', dataIndex: 'id', key: 'id' },
            { title: 'Name', dataIndex: 'name', key: 'name' },
            // { title: 'Telephone', dataIndex: 'telephone', key: 'telephone' },
            // { title: 'Live', dataIndex: 'live', key: 'live' },
            // { title: 'Remark', dataIndex: 'remark', key: 'remark' },
            { title: 'Address', dataIndex: 'address', key: 'address' },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Space size="small">
                  <Button
                    type="link"
                    onClick={() => {
                      this.context.viewOpener.open({
                        mode: 'drawer',
                        width: '50%',
                        content: (drawer) => <this.FormComponent drawer={drawer} record={record} />,
                      });
                    }}
                  >
                    Edit
                  </Button>
                  <Popconfirm
                    title="Are you sure to delete this record?"
                    onConfirm={async () => {
                      await this.resource.destroy(record[this.rowKey]);
                      this.context.message.success('Record deleted successfully');
                    }}
                  >
                    <Button type="link">Delete</Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
          pagination={{
            showSizeChanger: true,
            total: this.resource.getMeta('count'),
            pageSize: this.resource.getPageSize(),
            onChange: (page, pageSize) => {
              this.resource.setPage(page);
              this.resource.setPageSize(pageSize);
              this.resource.refresh();
            },
          }}
        />
      </Space>
    );
  }
}

HelloModel.registerFlow({
  key: 'resourceSettings',
  steps: {
    initResource: {
      handler: async (ctx) => {
        ctx.useResource('MultiRecordResource');
        const resource = ctx.resource as MultiRecordResource;
        resource.setDataSourceKey('main');
        resource.setResourceName('users');
        resource.setPageSize(10);
        await resource.refresh();
      },
    },
  },
});

class PluginHelloModel extends Plugin {
  async load() {
    // 注册 HelloModel 到 flowEngine
    this.flowEngine.registerModels({ HelloModel });
    const mock = new MockAdapter(this.app.apiClient.axios);

    mock.onPost('/users:destroy').reply(function (config) {
      return [200, { data: 1, meta: {} }];
    });

    mock.onPost('/users:create').reply(function (config) {
      return [200, { data: 1, meta: {} }];
    });

    mock.onPost('/users:update').reply(function (config) {
      return [200, { data: 1, meta: {} }];
    });

    mock.onGet('/users:list').reply(function (config) {
      // 使用 faker.js 生成随机数据
      const generateRandomUser = (id: number) => {
        return {
          id,
          name: faker.person.fullName(),
          telephone: faker.phone.number(),
          live: `${faker.location.city()}, ${faker.location.state()}`,
          remark: faker.helpers.arrayElement(['empty', 'active']),
          address: faker.location.streetAddress({ useFullAddress: true }),
        };
      };

      const pageSize = config.params.pageSize || 10;

      // 生成20条随机数据
      const userData = Array.from({ length: pageSize }, (_, index) => generateRandomUser(index + 1));

      return [
        200,
        {
          data: userData,
          meta: {
            count: 300,
            page: config.params.page || 1,
            pageSize,
          },
        },
      ];
    });

    // 创建 HelloModel 的实例（仅用于示例）
    const model = this.flowEngine.createModel({
      use: 'HelloModel',
    });

    // 添加路由，将模型渲染到根路径（仅用于示例）
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

// 创建应用实例，注册插件（仅用于示例）
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
