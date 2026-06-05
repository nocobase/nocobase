import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Space } from 'antd';
import React from 'react';

class HelloBlockModel extends FlowModel {
  render() {
    return (
      <Space direction="vertical">
        <Button
          onClick={async () => {
            await this.context.message.info({
              content: '这是 info 消息。',
            });
          }}
        >
          message.info
        </Button>
        <Button
          onClick={async () => {
            await this.context.message.success({
              content: '这是 success 消消息。',
            });
          }}
        >
          message.success
        </Button>
        <Button
          onClick={async () => {
            await this.context.message.error({
              content: '这是 error 消息。',
            });
          }}
        >
          message.error
        </Button>
        <Button
          onClick={async () => {
            await this.context.message.warning({
              content: '这是 warning 消息。',
            });
          }}
        >
          message.warning
        </Button>
        <Button
          onClick={async () => {
            await this.context.message.loading({
              content: '这是 loading 消息。',
              duration: 2,
            });
          }}
        >
          message.loading
        </Button>
        <Button
          onClick={async () => {
            await this.context.message.open({
              type: 'info',
              content: '这是 open 自定义消息。',
            });
          }}
        >
          message.open
        </Button>
      </Space>
    );
  }
}

class PluginHelloModel extends Plugin {
  async load() {
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

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
