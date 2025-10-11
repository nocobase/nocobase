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
            this.context.viewer.open({
              type: 'drawer',
              // width: 800,
              content: (currentView) => {
                return (
                  <div>
                    <currentView.Header title="Drawer Header" />
                    <div>This is a view opened from the flow context.</div>
                    <currentView.Footer>
                      <Button onClick={currentView.close}>Close</Button>
                    </currentView.Footer>
                  </div>
                );
              },
              closeOnEsc: true,
            });
          }}
        >
          Open drawer
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
