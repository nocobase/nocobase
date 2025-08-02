import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Space } from 'antd';
import React from 'react';

class HelloBlockModel extends FlowModel {
  render() {
    return (
      <Space direction="vertical">
        <Button
          onClick={() => {
            this.context.notification.info({
              message: 'Info',
              description: '这是 info 通知。',
              onClick: () => {
                console.log('点击了 info 通知');
              },
            });
          }}
        >
          notification.info
        </Button>
        <Button
          onClick={() => {
            this.context.notification.success({
              message: 'Success',
              description: '这是 success 通知。',
              duration: 2,
            });
          }}
        >
          notification.success
        </Button>
        <Button
          onClick={() => {
            this.context.notification.error({
              message: 'Error',
              description: '这是 error 通知。',
              placement: 'top',
            });
          }}
        >
          notification.error
        </Button>
        <Button
          onClick={() => {
            this.context.notification.warning({
              message: 'Warning',
              description: '这是 warning 通知。',
              key: 'warning-key',
              onClose: () => {
                console.log('warning 通知关闭');
              },
            });
          }}
        >
          notification.warning
        </Button>
        <Button
          onClick={() => {
            this.context.notification.open({
              message: 'Open',
              description: '这是 open 自定义通知。',
              type: 'info',
              actions: (
                <Button size="small" onClick={() => alert('自定义操作')}>
                  操作
                </Button>
              ),
            });
          }}
        >
          notification.open
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
