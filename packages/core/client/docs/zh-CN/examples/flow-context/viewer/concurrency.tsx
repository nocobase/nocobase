import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Space } from 'antd';
import React from 'react';

class HelloBlockModel extends FlowModel {
  render() {
    return (
      <Space>
        <Button
          onClick={() => {
            // 需在 onOpen（挂载完成）时继续下一个
            const openView = (cfg: any) =>
              new Promise<void>((resolve) => {
                this.context.viewer.open({
                  ...cfg,
                  onOpen: (...args: any[]) => {
                    // onOpen 触发后继续下一个
                    resolve();
                  },
                });
              });

            const dialogs = [
              {
                type: 'dialog',
                content: 'This is a view1 opened from the flow context.',
                closeOnEsc: true,
              },
              {
                type: 'dialog',
                content: 'This is a view2 opened from the flow context.',
                closeOnEsc: true,
              },
              {
                type: 'dialog',
                content: 'This is a view3 opened from the flow context.',
                closeOnEsc: true,
              },
              {
                type: 'dialog',
                content: 'This is a view4 opened from the flow context.',
                closeOnEsc: true,
              },
            ];

            // 用 Promise 链（reduce）依次在 onOpen 时打开下一个
            dialogs.reduce((p, cfg) => p.then(() => openView(cfg)), Promise.resolve());
          }}
        >
          Open dialog
        </Button>
        <Button
          onClick={() => {
            this.context.viewer.dialog({
              // width: 800,
              content: 'This is a view opened from the flow context.',
              closeOnEsc: true,
            });
          }}
        >
          Open dialog
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

// 创建应用实例，注册插件
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
