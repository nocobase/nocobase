import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Space } from 'antd';
import React from 'react';

class HelloBlockModel extends FlowModel {
  render() {
    return (
      <Space>
        <Button
          onClick={async () => {
            await this.context.modal.info({
              title: 'Info',
              content: '这是 info 弹窗。',
              onOk: () => {
                console.log('Info 确认');
              },
            });
          }}
        >
          info
        </Button>
        <Button
          onClick={async () => {
            await this.context.modal.success({
              title: 'Success',
              content: '这是 success 弹窗。',
              onOk: () => {
                console.log('Success 确认');
              },
            });
          }}
        >
          success
        </Button>
        <Button
          onClick={async () => {
            await this.context.modal.error({
              title: 'Error',
              content: '这是 error 弹窗。',
              onOk: () => {
                console.log('Error 确认');
              },
            });
          }}
        >
          error
        </Button>
        <Button
          onClick={async () => {
            await this.context.modal.warning({
              title: 'Warning',
              content: '这是 warning 弹窗。',
              onOk: () => {
                console.log('Warning 确认');
              },
            });
          }}
        >
          warning
        </Button>
        <Button
          onClick={async () => {
            await this.context.modal.confirm({
              title: 'Confirm',
              content: '这是 confirm 弹窗。',
              onOk: () => {
                console.log('Confirm 确认');
              },
              onCancel: () => {
                console.log('Confirm 取消');
              },
            });
          }}
        >
          confirm
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
