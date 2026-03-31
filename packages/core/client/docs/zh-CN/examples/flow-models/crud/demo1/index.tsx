import { faker } from '@faker-js/faker';
import { Application, Plugin } from '@nocobase/client';
import { FlowModelRenderer } from '@nocobase/flow-engine';
import MockAdapter from 'axios-mock-adapter';
import React from 'react';
import { CrudModel } from './CrudModel';

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

    this.flowEngine.registerModels({ CrudModel });

    const model = this.flowEngine.createModel({
      use: 'CrudModel',
    });

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
