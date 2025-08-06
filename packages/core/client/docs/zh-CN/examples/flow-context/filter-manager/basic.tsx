import { faker } from '@faker-js/faker';
import { Application, BlockGridModel, Plugin } from '@nocobase/client';
import {
  AddSubModelButton,
  FlowModel,
  FlowModelRenderer,
  MultiRecordResource,
  observable,
} from '@nocobase/flow-engine';
import { Button, Input, Space } from 'antd';
import MockAdapter from 'axios-mock-adapter';
import React from 'react';

class GridModel extends BlockGridModel {
  renderAddSubModelButton() {
    return (
      <AddSubModelButton
        model={this}
        subModelKey={'items'}
        items={[
          {
            key: 'TargetModel',
            label: 'TargetModel',
            useModel: 'TargetModel',
          },
          {
            key: 'FilterModel',
            label: 'FilterModel',
            useModel: 'FilterModel',
          },
        ]}
      >
        <Button type="dashed">Add Sub Model</Button>
      </AddSubModelButton>
    );
  }
}

class TargetModel extends FlowModel {
  get resource(): MultiRecordResource {
    return this.context.resource;
  }

  onInit() {
    this.context.defineProperty('resource', {
      get: () => {
        const resource = new MultiRecordResource();
        resource.setAPIClient(this.context.api);
        resource.setDataSourceKey('main');
        resource.setResourceName('users');
        resource.setPageSize(2);
        return resource;
      },
    });
  }
  render() {
    return (
      <>
        <pre>{JSON.stringify(this.resource.getFilter(), null, 2)}</pre>
        <pre>{JSON.stringify(this.resource.getData(), null, 2)}</pre>
      </>
    );
  }
}

TargetModel.registerFlow({
  key: 'myFlow',
  steps: {
    refresh: {
      async handler(ctx, params) {
        ctx.filterManager.bindToTarget(ctx.model.uid);
        await ctx.resource.refresh();
      },
    },
  },
});

class FilterModel extends FlowModel {
  filterValue = observable.ref<string>('default');

  getFilterValue() {
    return this.filterValue.value;
  }

  render() {
    return (
      <Space.Compact>
        <Input
          onChange={(e) => {
            this.filterValue.value = e.target.value;
          }}
          defaultValue={this.getFilterValue()}
          placeholder="Filter by name"
          style={{ width: 200, marginBottom: 16 }}
        />
        <Button
          type="primary"
          onClick={async () => {
            await this.context.filterManager.refreshTargetsByFilter('my-filter1');
          }}
        >
          Apply Filter
        </Button>
      </Space.Compact>
    );
  }
}

class PluginHelloModel extends Plugin {
  async load() {
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

    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ GridModel, TargetModel, FilterModel });

    const model = this.flowEngine.createModel({
      use: 'GridModel',
      stepParams: {
        filterManagerSettings: {
          filterConfigs: {
            0: {
              filterId: 'my-filter1', // 提供筛选条件的 FilterModel 的 UID
              targetId: 'my-target1', // 被筛选的 TargetModel 的 UID
              filterPaths: ['name'], // 筛选字段路径
              operator: '$eq',
            },
          },
        },
      },
      subModels: {
        items: [
          { uid: 'my-filter1', use: 'FilterModel', key: 'FilterModel' },
          { uid: 'my-target1', use: 'TargetModel', key: 'TargetModel' },
        ],
      },
    });

    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} showFlowSettings />,
    });
  }
}

// 创建应用实例，注册插件（仅用于示例）
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
