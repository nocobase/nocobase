import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Descriptions } from 'antd';
import MockAdapter from 'axios-mock-adapter';
import React from 'react';

class HelloBlockModel extends FlowModel {
  render() {
    return <Descriptions title="User Info" items={this.props.items} />;
  }
}

HelloBlockModel.registerFlow({
  key: 'api-example',
  title: 'API Example',
  auto: true,
  steps: {
    fetchData: {
      handler: async (ctx) => {
        // 使用 ctx.api.request 发起 GET 请求
        const response = await ctx.api.request({
          method: 'get',
          url: '/users:get',
        });

        // 假设接口返回原始数据
        const user = response.data.data;

        // 转换为 Descriptions 需要的 items 结构
        ctx.model.setProps({
          items: [
            { key: '1', label: 'UserName', children: <p>{user.name}</p> },
            { key: '2', label: 'Telephone', children: <p>{user.telephone}</p> },
            { key: '3', label: 'Live', children: <p>{user.live}</p> },
            { key: '4', label: 'Remark', children: <p>{user.remark}</p> },
            { key: '5', label: 'Address', children: <p>{user.address}</p> },
          ],
        });
      },
    },
  },
});

class PluginHelloModel extends Plugin {
  async load() {
    const mock = new MockAdapter(this.app.apiClient.axios);

    mock.onGet('/users:get').reply(200, {
      data: {
        name: 'Zhou Maomao',
        telephone: '1810000000',
        live: 'Hangzhou, Zhejiang',
        remark: 'empty',
        address: 'No. 18, Wantang Road, Xihu District, Hangzhou, Zhejiang, China',
      },
    });

    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ HelloBlockModel });
    const model = this.flowEngine.createModel({
      uid: 'my-model',
      use: 'HelloBlockModel',
    });
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

// 创建应用实例，注册插件
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
