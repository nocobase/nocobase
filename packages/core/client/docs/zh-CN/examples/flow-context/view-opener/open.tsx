import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Space } from 'antd';
import React from 'react';

class HelloBlockModel extends FlowModel {
  render() {
    return (
      <Button
        type="primary"
        onClick={async () => {
          await this.context.viewOpener.open({
            mode: 'drawer',
            width: 800,
            content: (drawer) => {
              return (
                <div>
                  <drawer.Header title="Hello Block" />
                  This is a view opened from the flow context.
                  <drawer.Footer>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                          onClick={() => {
                            drawer.close();
                          }}
                        >
                          Submit
                        </Button>
                      </Space>
                    </div>
                  </drawer.Footer>
                </div>
              );
            },
            closable: false,
          });
        }}
      >
        Open
      </Button>
    );
  }
}

HelloBlockModel.registerFlow({
  key: 'click',
  on: 'click',
  steps: {
    refReady: {
      handler: async (ctx) => {},
    },
  },
});

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
